import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import { Search, Map, Disc } from 'lucide-react'

const WaferMapViewer = () => {
    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState('')
    const [lots, setLots] = useState([])
    const [selectedLot, setSelectedLot] = useState('')
    const [maps, setMaps] = useState([])
    const [loading, setLoading] = useState(false)
    const [zoomMap, setZoomMap] = useState(null) // State for the map currently zoomed in

    // Fetch Products on Mount
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/v1/settings/products')
                const all = await res.json()
                const active = all.filter(p => p.active)
                setProducts(active)
                if (active.length > 0) setSelectedProduct(active[0].id)
            } catch (err) {
                console.error("Failed products fetch", err)
            }
        }
        fetchProducts()
    }, [])

    // Fetch Lots when Product Changes
    useEffect(() => {
        if (!selectedProduct) {
            setLots([])
            return
        }
        const fetchLots = async () => {
            try {
                const res = await fetch(`http://localhost:8000/api/v1/wafer/lots?product_id=${selectedProduct}`)
                const data = await res.json()
                setLots(data)
                if (data.length > 0) setSelectedLot(data[0])
                else setSelectedLot('')
            } catch (err) {
                console.error("Failed lots fetch", err)
            }
        }
        fetchLots()
    }, [selectedProduct])

    const fetchData = async () => {
        if (!selectedLot) return
        setLoading(true)
        try {
            const response = await fetch(`http://localhost:8000/api/v1/wafer/lot_maps?lot_id=${selectedLot}`)
            const result = await response.json()
            setMaps(result)
        } catch (error) {
            console.error("Error fetching wafer maps:", error)
        } finally {
            setLoading(false)
        }
    }

    // Auto-fetch when lot is selected (optional, or keep button)
    useEffect(() => {
        if (selectedLot) fetchData()
    }, [selectedLot])

    return (
        <div>
            {/* Zoom Modal */}
            {zoomMap && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', zIndex: 999,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} onClick={() => setZoomMap(null)}>
                    <div style={{
                        background: 'var(--card-bg)', padding: '20px', borderRadius: '8px',
                        width: '500px', height: '550px',
                        display: 'flex', flexDirection: 'column'
                    }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <h3>Wafer #{zoomMap.wafer_id} Detail</h3>
                            <button onClick={() => setZoomMap(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                        </div>
                        <div style={{ flex: 1 }}>
                            <Plot
                                data={[{
                                    x: zoomMap.x,
                                    y: zoomMap.y,
                                    mode: 'markers',
                                    type: 'scatter',
                                    marker: {
                                        size: 6, // Larger dots in zoom
                                        symbol: 'square',
                                        color: zoomMap.bin.map(b => {
                                            if (b === 1) return '#10b981'
                                            if (b === 3) return '#ef4444'
                                            if (b === 7) return '#f59e0b'
                                            return '#8b5cf6'
                                        })
                                    },
                                    hoverinfo: 'x+y+text',
                                    text: zoomMap.bin.map(b => `Bin ${b}`)
                                }]}
                                layout={{
                                    autosize: true,
                                    margin: { l: 20, r: 20, t: 20, b: 20 },
                                    xaxis: { showgrid: false, zeroline: false, showticklabels: false, range: [-16, 16] },
                                    yaxis: { showgrid: false, zeroline: false, showticklabels: false, scaleanchor: "x", scaleratio: 1, range: [-16, 16] },
                                    paper_bgcolor: 'rgba(0,0,0,0)',
                                    plot_bgcolor: 'rgba(0,0,0,0)',
                                    showlegend: false
                                }}
                                useResizeHandler={true}
                                style={{ width: "100%", height: "100%" }}
                                config={{ displayModeBar: true }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="filter-bar">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Search size={20} color="var(--text-muted)" />
                    <select
                        className="filter-input"
                        value={selectedProduct}
                        onChange={(e) => setSelectedProduct(e.target.value)}
                        style={{ border: 'none', background: 'transparent', width: '200px', cursor: 'pointer', fontSize: '1rem' }}
                    >
                        {products.length === 0 && <option value="">Loading Products...</option>}
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid var(--border-color)', paddingLeft: '20px' }}>
                    <Disc size={20} color="var(--text-muted)" />
                    <select
                        className="filter-input"
                        value={selectedLot}
                        onChange={(e) => setSelectedLot(e.target.value)}
                        style={{ border: 'none', background: 'transparent', width: '200px', cursor: 'pointer', fontSize: '1rem' }}
                        disabled={lots.length === 0}
                    >
                        {lots.length === 0 ? <option value="">No Lots Found</option> : lots.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </div>
                <button className="btn-primary" onClick={fetchData} style={{ marginLeft: 'auto' }}>Refresh Map</button>
            </div>

            <div className="card" style={{ height: 'auto', minHeight: '600px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <h3>Lot Wafer Maps (25 Wafers)</h3>
                    {maps.length > 0 && (
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '10px', height: '10px', background: '#10b981', borderRadius: '2px' }}></div>
                                <small>Pass</small>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '10px', height: '10px', background: '#ef4444', borderRadius: '2px' }}></div>
                                <small>Bin 3 (Open)</small>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '10px', height: '10px', background: '#f59e0b', borderRadius: '2px' }}></div>
                                <small>Bin 7 (Short)</small>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '10px', height: '10px', background: '#8b5cf6', borderRadius: '2px' }}></div>
                                <small>Bin 99 (Other)</small>
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
                        gap: '8px',
                        padding: '10px'
                    }}>
                        {maps.map((mapData, index) => (
                            <div key={index}
                                style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden', background: 'var(--bg-color)', cursor: 'pointer', transition: 'border-color 0.2s' }}
                                onClick={() => setZoomMap(mapData)}
                                className="map-thumbnail"
                            >
                                <div style={{ textAlign: 'center', fontSize: '0.7rem', padding: '2px 0', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}>
                                    Wafer #{mapData.wafer_id}
                                </div>
                                <div style={{ height: '100px', pointerEvents: 'none' }}> {/* Disable pointer events on thumbnail plot to catching click on parent div */}
                                    <Plot
                                        data={[
                                            {
                                                x: mapData.x,
                                                y: mapData.y,
                                                mode: 'markers',
                                                type: 'scatter', // SVG to avoid WebGL context limit (max 16) with 25 maps
                                                marker: {
                                                    size: 2,
                                                    symbol: 'square',
                                                    color: mapData.bin.map(b => {
                                                        if (b === 1) return '#10b981' // Pass
                                                        if (b === 3) return '#ef4444' // Open
                                                        if (b === 7) return '#f59e0b' // Short
                                                        return '#8b5cf6' // Other
                                                    })
                                                },
                                                hoverinfo: 'none'
                                            }
                                        ]}
                                        layout={{
                                            autosize: true,
                                            margin: { l: 0, r: 0, t: 0, b: 0 },
                                            xaxis: {
                                                showgrid: false,
                                                zeroline: false,
                                                showticklabels: false,
                                                range: [-16, 16]
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
                    <div style={{ padding: '20px', textAlign: 'center' }}>Select a Product and Lot to view maps</div>
                )}
            </div>
        </div>
    )
}

export default WaferMapViewer
