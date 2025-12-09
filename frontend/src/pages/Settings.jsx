import { useState, useEffect } from 'react'
import { Save, ToggleLeft, ToggleRight, Calendar } from 'lucide-react'

const Settings = () => {
    const [products, setProducts] = useState([])
    const [targets, setTargets] = useState({})
    const [loading, setLoading] = useState(false)
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)) // YYYY-MM
    const [notification, setNotification] = useState(null)

    useEffect(() => {
        fetchProducts()
    }, [])

    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/v1/settings/products')
            const data = await res.json()
            setProducts(data)
            // Fetch targets for all products for current month
            data.forEach(p => fetchTarget(p.id, selectedMonth))
        } catch (error) {
            console.error("Failed to fetch products", error)
        }
    }

    const fetchTarget = async (productId, month) => {
        try {
            const res = await fetch(`http://localhost:8000/api/v1/settings/targets?product_id=${productId}&month=${month}`)
            const data = await res.json()
            setTargets(prev => ({
                ...prev,
                [`${productId}-${month}`]: data.target
            }))
        } catch (error) {
            console.error("Failed to fetch target", error)
        }
    }

    const handleToggleProduct = async (productId, currentStatus) => {
        try {
            await fetch(`http://localhost:8000/api/v1/settings/products/${productId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !currentStatus })
            })
            fetchProducts()
            showNotification("Product status updated")
        } catch (error) {
            console.error("Failed to toggle product", error)
        }
    }

    const handleTargetChange = (productId, val) => {
        setTargets(prev => ({
            ...prev,
            [`${productId}-${selectedMonth}`]: val
        }))
    }

    const handleSaveTarget = async (productId) => {
        const targetVal = targets[`${productId}-${selectedMonth}`]
        try {
            await fetch(`http://localhost:8000/api/v1/settings/targets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: productId,
                    month: selectedMonth,
                    target: parseFloat(targetVal)
                })
            })
            showNotification(`Target saved for ${productId}`)
        } catch (error) {
            console.error("Failed to save target", error)
        }
    }

    const showNotification = (msg) => {
        setNotification(msg)
        setTimeout(() => setNotification(null), 3000)
    }

    return (
        <div>
            <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
                <h2>Settings</h2>
                {notification && (
                    <div style={{
                        padding: '8px 16px',
                        background: 'var(--success-color)',
                        color: 'white',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.9rem'
                    }}>
                        {notification}
                    </div>
                )}
            </div>

            <div className="grid-dashboard">
                <div className="card">
                    <h3 style={{ marginBottom: '20px' }}>Product Management</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {products.map(p => (
                            <div key={p.id} style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '15px',
                                background: 'var(--bg-color)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: '600' }}>{p.name}</div>
                                    <small style={{ color: 'var(--text-muted)' }}>ID: {p.id}</small>
                                </div>
                                <button
                                    onClick={() => handleToggleProduct(p.id, p.active)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: p.active ? 'var(--success-color)' : 'var(--text-muted)'
                                    }}
                                >
                                    {p.active ? 'Active' : 'Inactive'}
                                    {p.active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', alignItems: 'center' }}>
                        <h3>Yield Targets</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Calendar size={16} color="var(--text-muted)" />
                            <input
                                type="month"
                                value={selectedMonth}
                                onChange={(e) => {
                                    setSelectedMonth(e.target.value)
                                    products.forEach(p => fetchTarget(p.id, e.target.value))
                                }}
                                className="filter-input"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {products.filter(p => p.active).length === 0 && (
                            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No active products. Activate products to set targets.</div>
                        )}
                        {products.filter(p => p.active).map(p => (
                            <div key={p.id} style={{
                                padding: '15px',
                                background: 'var(--bg-color)',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid var(--border-color)'
                            }}>
                                <div style={{ marginBottom: '8px', fontWeight: '500' }}>{p.name}</div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={targets[`${p.id}-${selectedMonth}`] || ''}
                                        onChange={(e) => handleTargetChange(p.id, e.target.value)}
                                        className="filter-input"
                                        style={{ width: '100px' }}
                                        placeholder="%"
                                    />
                                    <button
                                        className="btn-primary"
                                        onClick={() => handleSaveTarget(p.id)}
                                        style={{ padding: '6px 12px' }}
                                    >
                                        <Save size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings
