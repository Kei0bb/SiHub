import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import { Search, TrendingUp, TrendingDown, Activity, Target, Layers } from 'lucide-react'

const Dashboard = () => {
    const [productId, setProductId] = useState('')
    const [products, setProducts] = useState([])
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)

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

            <div className="grid-dashboard">
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>Yield Trend</h3>
                    {loading ? (
                        <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading data...</div>
                    ) : data && data.daily_trends ? (
                        <div className="chart-container">
                            <Plot
                                data={[
                                    // Yield Line (Left Axis)
                                    {
                                        x: data.daily_trends.map(d => d.date),
                                        y: data.daily_trends.map(d => d.mean_yield),
                                        type: 'scatter',
                                        mode: 'lines+markers',
                                        marker: { color: '#3b82f6', size: 6 },
                                        line: { width: 3 },
                                        name: 'Yield (%)',
                                        yaxis: 'y1'
                                    },
                                    // Target Line
                                    {
                                        x: [data.daily_trends[0]?.date, data.daily_trends[data.daily_trends.length - 1]?.date],
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
                                        if (data.daily_trends.length === 0) return [];
                                        // content of bin_stats is like {"1_Pass": 95, "3_Open": 2...}
                                        // Collect all unique bin keys from all days to be safe, excluding Pass
                                        const allBins = new Set();
                                        data.daily_trends.forEach(d => {
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
                                            x: data.daily_trends.map(d => d.date),
                                            y: data.daily_trends.map(d => d.bin_stats[binName] || 0),
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
                                        title: 'Date',
                                        gridcolor: '#334155',
                                        tickfont: { color: '#94a3b8' },
                                        titlefont: { color: '#94a3b8' }
                                    },
                                    yaxis: {
                                        title: 'Yield (%)',
                                        range: [80, 100],
                                        gridcolor: '#334155',
                                        zerolinecolor: '#334155',
                                        tickfont: { color: '#3b82f6' },
                                        titlefont: { color: '#3b82f6' }
                                    },
                                    yaxis2: {
                                        title: 'Fail Rate (%)',
                                        titlefont: { color: '#ef4444' },
                                        tickfont: { color: '#ef4444' },
                                        overlaying: 'y',
                                        side: 'right',
                                        range: [0, 20], // Adjusted for visibility of fail rates
                                        showgrid: false
                                    },
                                    barmode: 'stack',
                                    paper_bgcolor: 'rgba(0,0,0,0)',
                                    plot_bgcolor: 'rgba(0,0,0,0)',
                                    showlegend: true,
                                    legend: { orientation: "h", y: 1.1, font: { color: '#f1f5f9' } }
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

                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>Distribution</h3>
                    {data && data.statistics && data.statistics.histogram ? (
                        <div className="chart-container">
                            <Plot
                                data={[
                                    {
                                        x: data.statistics.histogram.bins.slice(0, -1),
                                        y: data.statistics.histogram.counts,
                                        type: 'bar',
                                        marker: { color: '#6366f1' }
                                    }
                                ]}
                                layout={{
                                    autosize: true,
                                    margin: { l: 30, r: 10, t: 20, b: 30 },
                                    xaxis: {
                                        title: 'Yield Range',
                                        gridcolor: '#334155',
                                        tickfont: { color: '#94a3b8' },
                                        titlefont: { color: '#94a3b8' }
                                    },
                                    yaxis: {
                                        title: 'Count',
                                        gridcolor: '#334155',
                                        tickfont: { color: '#94a3b8' },
                                        titlefont: { color: '#94a3b8' }
                                    },
                                    paper_bgcolor: 'rgba(0,0,0,0)',
                                    plot_bgcolor: 'rgba(0,0,0,0)',
                                }}
                                useResizeHandler={true}
                                style={{ width: "100%", height: "100%" }}
                                config={{ displayModeBar: false }}
                            />
                        </div>
                    ) : (
                        <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No histogram data</div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Dashboard
