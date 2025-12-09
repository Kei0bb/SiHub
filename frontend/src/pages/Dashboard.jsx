import { useState, useEffect, useMemo } from 'react'
import Plot from 'react-plotly.js'
import { Search, Activity, Target, Layers, BarChart3 } from 'lucide-react'

const Dashboard = () => {
    const [productId, setProductId] = useState('')
    const [products, setProducts] = useState([])
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [xAxisMode, setXAxisMode] = useState('daily') // 'daily', 'weekly', 'monthly', 'quarterly', 'bylot'

    useEffect(() => {
        const init = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/v1/settings/products')
                const allProducts = await res.json()
                const activeProducts = allProducts.filter(p => p.active)
                setProducts(activeProducts)
                if (activeProducts.length > 0) {
                    setProductId(activeProducts[0].id)
                }
            } catch (err) {
                console.error("Failed to load products", err)
            }
        }
        init()
    }, [])

    const fetchData = async () => {
        if (!productId) return
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:8000/api/v1/yield/trend?product_id=${productId}`)
            const result = await response.json()
            setData(result)
        } catch (error) {
            console.error("Error fetching data:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (productId) {
            fetchData()
        }
    }, [productId])

    // Aggregate data based on xAxisMode
    const aggregatedData = useMemo(() => {
        if (!data || !data.daily_trends) return null

        const trends = data.daily_trends

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

        if (xAxisMode === 'daily') {
            // No aggregation, use daily data as-is
            return trends
        }

        // Group by period
        const groups = {}
        trends.forEach(d => {
            let key
            const date = new Date(d.date)
            if (xAxisMode === 'weekly') {
                // Get week number
                const startOfYear = new Date(date.getFullYear(), 0, 1)
                const weekNum = Math.ceil(((date - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7)
                key = `${date.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
            } else if (xAxisMode === 'monthly') {
                // Display as 'Nov 2024' format
                key = `${monthNames[date.getMonth()]} ${date.getFullYear()}`
            } else if (xAxisMode === 'quarterly') {
                const quarter = Math.floor(date.getMonth() / 3) + 1
                key = `${date.getFullYear()}-Q${quarter}`
            } else if (xAxisMode === 'bylot') {
                // Group by Lot ID - extract from the data if available
                key = d.lot_id || d.date
            }

            if (!groups[key]) {
                groups[key] = { yields: [], bin_stats_sum: {}, bin_stats_count: {} }
            }
            groups[key].yields.push(d.mean_yield)

            // Aggregate bin stats (sum and count for averaging)
            if (d.bin_stats) {
                Object.entries(d.bin_stats).forEach(([binName, value]) => {
                    if (!groups[key].bin_stats_sum[binName]) {
                        groups[key].bin_stats_sum[binName] = 0
                        groups[key].bin_stats_count[binName] = 0
                    }
                    groups[key].bin_stats_sum[binName] += value
                    groups[key].bin_stats_count[binName] += 1
                })
            }
        })

        // Calculate averages for both yield and bin_stats
        return Object.entries(groups).map(([key, val]) => {
            const avgBinStats = {}
            Object.keys(val.bin_stats_sum).forEach(binName => {
                avgBinStats[binName] = Math.round(val.bin_stats_sum[binName] / val.bin_stats_count[binName])
            })
            return {
                date: key,
                mean_yield: val.yields.reduce((a, b) => a + b, 0) / val.yields.length,
                bin_stats: avgBinStats
            }
        }).sort((a, b) => a.date.localeCompare(b.date))
    }, [data, xAxisMode])

    // Calculate fail ratio data
    const failRatioData = useMemo(() => {
        if (!data || !data.daily_trends) return null

        const allBins = {}
        let totalFails = 0

        data.daily_trends.forEach(d => {
            if (d.bin_stats) {
                Object.entries(d.bin_stats).forEach(([binName, value]) => {
                    if (!binName.includes('Pass') && !binName.startsWith('1_')) {
                        if (!allBins[binName]) allBins[binName] = 0
                        allBins[binName] += value
                        totalFails += value
                    }
                })
            }
        })

        if (totalFails === 0) return null

        return Object.entries(allBins).map(([name, count]) => ({
            name,
            count,
            ratio: ((count / totalFails) * 100).toFixed(1)
        })).sort((a, b) => b.count - a.count)
    }, [data])

    const xAxisModes = [
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'quarterly', label: 'Quarterly' },
        { value: 'bylot', label: 'Lot ID' }
    ]

    return (
        <div>
            <div className="filter-bar">
                <Search size={20} color="var(--text-muted)" />
                <select
                    className="filter-input"
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    style={{ border: 'none', background: 'transparent', fontSize: '1rem', width: '300px', cursor: 'pointer' }}
                >
                    {products.length === 0 && <option value="">Loading products...</option>}
                    {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                </select>
                <div style={{ marginLeft: 'auto' }}>
                    <button className="btn-primary" onClick={fetchData}>Refresh</button>
                </div>
            </div>

            {data && data.statistics && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '20px' }}>
                    <div className="card card-glass">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <div className="stat-label">Average Yield</div>
                                <div className="stat-value" style={{ color: 'var(--primary-color)' }}>{data.statistics.average}%</div>
                            </div>
                            <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                                <Activity size={24} color="var(--primary-color)" />
                            </div>
                        </div>
                    </div>
                    <div className="card card-glass">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <div className="stat-label">Target</div>
                                <div className="stat-value" style={{ color: 'var(--success-color)' }}>{data.statistics.target}%</div>
                            </div>
                            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                                <Target size={24} color="var(--success-color)" />
                            </div>
                        </div>
                    </div>
                    <div className="card card-glass">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <div className="stat-label">Std Dev</div>
                                <div className="stat-value">{data.statistics.std_dev}</div>
                            </div>
                            <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px' }}>
                                <Layers size={24} color="var(--warning-color)" />
                            </div>
                        </div>
                    </div>
                    <div className="card card-glass">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <div>
                                <div className="stat-label">Total Lots</div>
                                <div className="stat-value">{data.statistics.count}</div>
                            </div>
                            <div style={{ padding: '10px', background: 'rgba(148, 163, 184, 0.1)', borderRadius: '8px' }}>
                                <Layers size={24} color="var(--text-muted)" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Yield Trend Chart - Full Width */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3>Yield Trend</h3>
                    <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-color)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
                        {xAxisModes.map(mode => (
                            <button
                                key={mode.value}
                                onClick={() => setXAxisMode(mode.value)}
                                style={{
                                    padding: '6px 12px',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    background: xAxisMode === mode.value ? 'var(--primary-color)' : 'transparent',
                                    color: xAxisMode === mode.value ? 'white' : 'var(--text-muted)',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {mode.label}
                            </button>
                        ))}
                    </div>
                </div>
                {loading ? (
                    <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading data...</div>
                ) : aggregatedData ? (
                    <div className="chart-container">
                        <Plot
                            data={[
                                // Yield Line (Left Axis)
                                {
                                    x: aggregatedData.map(d => d.date),
                                    y: aggregatedData.map(d => d.mean_yield),
                                    type: 'scatter',
                                    mode: 'lines+markers',
                                    marker: { color: '#3b82f6', size: 6 },
                                    line: { width: 3 },
                                    name: 'Yield (%)',
                                    yaxis: 'y1'
                                },
                                // Target Line
                                {
                                    x: [aggregatedData[0]?.date, aggregatedData[aggregatedData.length - 1]?.date],
                                    y: [data.statistics.target, data.statistics.target],
                                    type: 'scatter',
                                    mode: 'lines',
                                    line: { color: '#10b981', dash: 'dash', width: 2 },
                                    name: 'Target',
                                    hoverinfo: 'skip',
                                    yaxis: 'y1'
                                },
                                // Dynamic Fail Bin Bars (Right Axis)
                                ...(() => {
                                    if (aggregatedData.length === 0) return [];
                                    const allBins = new Set();
                                    aggregatedData.forEach(d => {
                                        if (d.bin_stats) {
                                            Object.keys(d.bin_stats).forEach(k => {
                                                if (!k.includes('Pass') && !k.startsWith('1_')) {
                                                    allBins.add(k);
                                                }
                                            });
                                        }
                                    });

                                    const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
                                    return Array.from(allBins).map((binName, index) => ({
                                        x: aggregatedData.map(d => d.date),
                                        y: aggregatedData.map(d => d.bin_stats[binName] || 0),
                                        type: 'bar',
                                        name: binName,
                                        marker: { color: colors[index % colors.length] },
                                        yaxis: 'y2',
                                        opacity: 0.7
                                    }));
                                })()
                            ]}
                            layout={{
                                autosize: true,
                                margin: { l: 50, r: 50, t: 20, b: 50 },
                                xaxis: {
                                    title: xAxisMode === 'bylot' ? 'Lot ID' : xAxisMode.charAt(0).toUpperCase() + xAxisMode.slice(1),
                                    gridcolor: 'var(--border-color)',
                                    tickfont: { color: 'var(--text-muted)' },
                                    titlefont: { color: 'var(--text-muted)' }
                                },
                                yaxis: {
                                    title: 'Yield (%)',
                                    range: [80, 100],
                                    gridcolor: 'var(--border-color)',
                                    zerolinecolor: 'var(--border-color)',
                                    tickfont: { color: '#3b82f6' },
                                    titlefont: { color: '#3b82f6' }
                                },
                                yaxis2: {
                                    title: 'Fail Count',
                                    titlefont: { color: '#ef4444' },
                                    tickfont: { color: '#ef4444' },
                                    overlaying: 'y',
                                    side: 'right',
                                    showgrid: false
                                },
                                barmode: 'stack',
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                showlegend: true,
                                legend: {
                                    orientation: "h",
                                    y: 1.12,
                                    font: { color: 'var(--text-color)' }
                                }
                            }}
                            useResizeHandler={true}
                            style={{ width: "100%", height: "100%" }}
                            config={{ displayModeBar: false }}
                        />
                    </div>
                ) : (
                    <div>No data available</div>
                )}
            </div>

            {/* Fail Ratio - Bottom Section */}
            <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <BarChart3 size={20} color="var(--danger-color)" />
                    <h3>Fail Ratio</h3>
                </div>
                {failRatioData ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                        <div className="chart-container" style={{ height: '300px' }}>
                            <Plot
                                data={[
                                    {
                                        labels: failRatioData.map(d => d.name),
                                        values: failRatioData.map(d => d.count),
                                        type: 'pie',
                                        hole: 0.4,
                                        marker: {
                                            colors: ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1']
                                        },
                                        textinfo: 'label+percent',
                                        textfont: { color: 'var(--text-color)' }
                                    }
                                ]}
                                layout={{
                                    autosize: true,
                                    margin: { l: 20, r: 20, t: 20, b: 20 },
                                    paper_bgcolor: 'rgba(0,0,0,0)',
                                    plot_bgcolor: 'rgba(0,0,0,0)',
                                    showlegend: true,
                                    legend: {
                                        font: { color: 'var(--text-color)' },
                                        orientation: 'v'
                                    }
                                }}
                                useResizeHandler={true}
                                style={{ width: "100%", height: "100%" }}
                                config={{ displayModeBar: false }}
                            />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {failRatioData.map((item, idx) => {
                                const colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1']
                                return (
                                    <div key={item.name} style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px',
                                        background: 'var(--bg-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        <div style={{
                                            width: '12px',
                                            height: '12px',
                                            borderRadius: '3px',
                                            background: colors[idx % colors.length]
                                        }}></div>
                                        <div style={{ flex: 1, fontWeight: '500' }}>{item.name}</div>
                                        <div style={{ color: 'var(--text-muted)' }}>{item.count.toLocaleString()} chips</div>
                                        <div style={{
                                            fontWeight: '600',
                                            color: colors[idx % colors.length],
                                            minWidth: '50px',
                                            textAlign: 'right'
                                        }}>{item.ratio}%</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No fail data available</div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
