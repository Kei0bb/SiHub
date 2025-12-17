import { useState, useEffect } from 'react'
import Plot from 'react-plotly.js'
import { Search, Map, Disc, CheckSquare, Square } from 'lucide-react'

const WaferMapViewer = () => {
    const [products, setProducts] = useState([])
    const [selectedProduct, setSelectedProduct] = useState('')
    const [lots, setLots] = useState([])
    const [selectedLots, setSelectedLots] = useState([]) // Changed to array for multi-select
    const [lotsData, setLotsData] = useState({}) // { lotId: [maps] }
    const [loading, setLoading] = useState(false)
    const [zoomMap, setZoomMap] = useState(null)

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
                const res = await fetch(`/api/v1/wafer/lots?product_id=${selectedProduct}`)
                const data = await res.json()
                setLots(data)
                // Auto-select first lot
                if (data.length > 0) setSelectedLots([data[0]])
                else setSelectedLots([])
            } catch (err) {
                console.error("Failed lots fetch", err)
            }
        }
        fetchLots()
        setLotsData({}) // Clear previous data
    }, [selectedProduct])

    const toggleLotSelection = (lotId) => {
        setSelectedLots(prev => {
            if (prev.includes(lotId)) {
                return prev.filter(l => l !== lotId)
            } else {
                return [...prev, lotId]
            }
        })
    }

    const selectAllLots = () => {
        setSelectedLots([...lots])
    }

    const clearLotSelection = () => {
        setSelectedLots([])
    }

    const fetchData = async () => {
        if (selectedLots.length === 0) return
        setLoading(true)
        try {
            const newData = {}
            for (const lotId of selectedLots) {
                if (!lotsData[lotId]) {
                    const response = await fetch(`http://localhost:8000/api/v1/wafer/lot_maps?lot_id=${lotId}`)
                    const result = await response.json()
                    newData[lotId] = result
                } else {
                    newData[lotId] = lotsData[lotId]
                }
            }
            setLotsData(prev => ({ ...prev, ...newData }))
        } catch (error) {
            console.error("Error fetching wafer maps:", error)
        } finally {
            setLoading(false)
        }
    }

    // Auto-fetch when lots selection changes
    useEffect(() => {
        if (selectedLots.length > 0) fetchData()
    }, [selectedLots])

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
                            <h3>Wafer #{zoomMap.wafer_id} Detail ({zoomMap.lot_id})</h3>
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
                                        size: 6,
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
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        {selectedLots.length} of {lots.length} lots selected
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    <button
                        className="btn-primary"
                        onClick={selectAllLots}
                        style={{ padding: '8px 12px', fontSize: '0.85rem' }}
                    >
                        Select All
                    </button>
                    <button
                        onClick={clearLotSelection}
                        style={{
                            padding: '8px 12px',
                            fontSize: '0.85rem',
                            background: 'var(--bg-color)',
                            border: '1px solid var(--border-color)',
                            borderRadius: 'var(--radius-sm)',
                            cursor: 'pointer',
                            color: 'var(--text-color)'
                        }}
                    >
                        Clear
                    </button>
                    <button className="btn-primary" onClick={fetchData}>Refresh</button>
                </div>
            </div>

            {/* Lot Selection Grid */}
            <div className="card" style={{ marginBottom: '20px', padding: '15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <Map size={18} color="var(--text-muted)" />
                    <h4 style={{ margin: 0 }}>Select Lots to Display</h4>
                </div>
                <div style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '8px'
                }}>
                    {lots.map(lotId => {
                        const isSelected = selectedLots.includes(lotId)
                        return (
                            <button
                                key={lotId}
                                onClick={() => toggleLotSelection(lotId)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '8px 12px',
                                    background: isSelected ? 'var(--primary-color)' : 'var(--bg-color)',
                                    color: isSelected ? 'white' : 'var(--text-color)',
                                    border: `1px solid ${isSelected ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '500',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                                {lotId}
                            </button>
                        )
                    })}
                    {lots.length === 0 && (
                        <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No lots available for this product</div>
                    )}
                </div>
            </div>

            {/* Wafer Maps Display - Grouped by Lot */}
            {loading ? (
                <div className="card" style={{ height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Loading wafer maps...
                </div>
            ) : selectedLots.length > 0 ? (
                selectedLots.map(lotId => {
                    const maps = lotsData[lotId] || []
                    return (
                        <div key={lotId} className="card" style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <h3>{lotId} (25 Wafers)</h3>
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
                            </div>

                            {maps.length > 0 ? (
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
                                            <div style={{ height: '100px', pointerEvents: 'none' }}>
                                                <Plot
                                                    data={[
                                                        {
                                                            x: mapData.x,
                                                            y: mapData.y,
                                                            mode: 'markers',
                                                            type: 'scatter',
                                                            marker: {
                                                                size: 2,
                                                                symbol: 'square',
                                                                color: mapData.bin.map(b => {
                                                                    if (b === 1) return '#10b981'
                                                                    if (b === 3) return '#ef4444'
                                                                    if (b === 7) return '#f59e0b'
                                                                    return '#8b5cf6'
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
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
                            )}
                        </div>
                    )
                })
            ) : (
                <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Select lots above to view wafer maps
                </div>
            )}
        </div>
    )
}

export default WaferMapViewer
