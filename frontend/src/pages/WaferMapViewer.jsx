import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import { Search, Map, Disc } from 'lucide-react'

const WaferMapViewer = () => {
    const [lotId, setLotId] = useState('LOT-20231027')
    const [maps, setMaps] = useState([])
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:8000/api/v1/wafer/lot_maps?lot_id=${lotId}`)
            const result = await response.json()
            setMaps(result)
        } catch (error) {
            console.error("Error fetching wafer maps:", error)
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
                <button className="btn-primary" onClick={handleApply}>Load Lot Maps</button>
            </div>

            <div className="card" style={{ height: 'auto', minHeight: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3>Lot Wafer Maps (25 Wafers)</h3>
                    {maps.length > 0 && (
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '2px' }}></div>
                                <small>Pass</small>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '2px' }}></div>
                                <small>Fail</small>
                            </div>
                        </div>
                    )}
                </div>

                {loading ? (
                    <div style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading map grid...</div>
                ) : maps.length > 0 ? (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(5, 1fr)',
                        gap: '10px',
                        padding: '10px'
                    }}>
                        {maps.map((mapData, index) => (
                            <div key={index} style={{ border: '1px solid #334155', borderRadius: '4px', overflow: 'hidden', background: 'rgba(30, 41, 59, 0.5)' }}>
                                <div style={{ textAlign: 'center', fontSize: '0.8rem', padding: '5px', color: 'var(--text-muted)', borderBottom: '1px solid #334155' }}>
                                    Wafer #{mapData.wafer_id}
                                </div>
                                <div style={{ height: '150px' }}>
                                    <Plot
                                        data={[
                                            {
                                                x: mapData.x,
                                                y: mapData.y,
                                                mode: 'markers',
                                                type: 'scatter', // SVG for better performance heavily on DOM but safer for context limits
                                                marker: {
                                                    size: 3,
                                                    symbol: 'square',
                                                    color: mapData.bin.map(b => b === 1 ? '#10b981' : '#ef4444')
                                                },
                                                hoverinfo: 'none' // Disable hover for grid view performance
                                            }
                                        ]}
                                        layout={{
                                            autosize: true,
                                            margin: { l: 0, r: 0, t: 0, b: 0 },
                                            xaxis: {
                                                showgrid: false,
                                                zeroline: false,
                                                showticklabels: false,
                                                range: [-16, 16] // Fixed range to keep scale consistent
                                            },
                                            yaxis: {
                                                showgrid: false,
                                                zeroline: false,
                                                showticklabels: false,
                                                scaleanchor: "x",
                                                scaleratio: 1,
                                                range: [-16, 16]
                                            },
                                            paper_bgcolor: 'rgba(0,0,0,0)',
                                            plot_bgcolor: 'rgba(0,0,0,0)',
                                            showlegend: false
                                        }}
                                        useResizeHandler={true}
                                        style={{ width: "100%", height: "100%" }}
                                        config={{ displayModeBar: false, staticPlot: true }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: '20px', textAlign: 'center' }}>No maps available</div>
                )}
            </div>
        </div>
    )
}

export default WaferMapViewer
