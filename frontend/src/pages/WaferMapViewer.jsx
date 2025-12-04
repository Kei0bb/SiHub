import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import { Search, Map, Disc } from 'lucide-react'

const WaferMapViewer = () => {
    const [lotId, setLotId] = useState('LOT-20231027')
    const [waferId, setWaferId] = useState(1)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:8000/api/v1/wafer/map?lot_id=${lotId}&wafer_id=${waferId}`)
            const result = await response.json()
            setData(result)
        } catch (error) {
            console.error("Error fetching wafer map:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleApply = () => {
        fetchData()
    }

    return (
        <div>
            <div className="filter-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Disc size={20} color="var(--text-muted)" />
                    <input
                        type="text"
                        className="filter-input"
                        value={lotId}
                        onChange={(e) => setLotId(e.target.value)}
                        placeholder="Lot ID"
                        style={{ width: '150px' }}
                    />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Wafer #</span>
                    <input
                        type="number"
                        className="filter-input"
                        value={waferId}
                        onChange={(e) => setWaferId(parseInt(e.target.value))}
                        placeholder="Wafer ID"
                        style={{ width: '80px' }}
                    />
                </div>
                <button className="btn-primary" onClick={handleApply}>Load Map</button>
            </div>

            <div className="card" style={{ height: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3>Wafer Map</h3>
                    {data && (
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
                                <small>Pass (Bin 1)</small>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
                                <small>Fail (Bin 99)</small>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading map...</div>
                ) : data ? (
                    <div className="chart-container" style={{ height: '500px' }}>
                        <Plot
                            data={[
                                {
                                    x: data.x,
                                    y: data.y,
                                    mode: 'markers',
                                    type: 'scattergl',
                                    marker: {
                                        size: 8,
                                        symbol: 'square',
                                        color: data.bin.map(b => b === 1 ? '#10b981' : '#ef4444'),
                                        line: {
                                            width: 0.5,
                                            color: 'rgba(0,0,0,0.1)'
                                        }
                                    },
                                    text: data.bin.map((b, i) => `X: ${data.x[i]}, Y: ${data.y[i]}<br>Bin: ${b}`),
                                    hoverinfo: 'text',
                                    name: 'Die'
                                }
                            ]}
                            layout={{
                                autosize: true,
                                margin: { l: 20, r: 20, t: 20, b: 20 },
                                xaxis: {
                                    showgrid: false,
                                    zeroline: false,
                                    showticklabels: false,
                                    scaleanchor: "y",
                                    scaleratio: 1
                                },
                                yaxis: {
                                    showgrid: false,
                                    zeroline: false,
                                    showticklabels: false
                                },
                                paper_bgcolor: 'rgba(0,0,0,0)',
                                plot_bgcolor: 'rgba(0,0,0,0)',
                                showlegend: false
                            }}
                            useResizeHandler={true}
                            style={{ width: "100%", height: "100%" }}
                            config={{ displayModeBar: true }}
                        />
                    </div>
                ) : (
                    <div>No data available</div>
                )}
            </div>
        </div>
    )
}

export default WaferMapViewer
