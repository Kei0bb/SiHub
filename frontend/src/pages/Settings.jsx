import { useState, useEffect } from 'react'
import { Save, ToggleLeft, ToggleRight, Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const Settings = () => {
    const [products, setProducts] = useState([])
    const [targets, setTargets] = useState({}) // { 'productId-YYYY-MM': value }
    const [loading, setLoading] = useState(false)
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
    const [notification, setNotification] = useState(null)

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ]

    useEffect(() => {
        fetchProducts()
    }, [])

    useEffect(() => {
        // Fetch targets for all products for selected year
        if (products.length > 0) {
            fetchYearlyTargets()
        }
    }, [selectedYear, products])

    const fetchProducts = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/v1/settings/products')
            const data = await res.json()
            setProducts(data)
        } catch (error) {
            console.error("Failed to fetch products", error)
        }
    }

    const fetchYearlyTargets = async () => {
        setLoading(true)
        try {
            const newTargets = {}
            for (const product of products.filter(p => p.active)) {
                for (let month = 1; month <= 12; month++) {
                    const monthStr = `${selectedYear}-${String(month).padStart(2, '0')}`
                    const res = await fetch(`http://localhost:8000/api/v1/settings/targets?product_id=${product.id}&month=${monthStr}`)
                    const data = await res.json()
                    newTargets[`${product.id}-${monthStr}`] = data.target
                }
            }
            setTargets(prev => ({ ...prev, ...newTargets }))
        } catch (error) {
            console.error("Failed to fetch targets", error)
        } finally {
            setLoading(false)
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

    const handleTargetChange = (productId, month, val) => {
        const key = `${productId}-${selectedYear}-${String(month).padStart(2, '0')}`
        setTargets(prev => ({
            ...prev,
            [key]: val
        }))
    }

    const handleSaveTarget = async (productId, month) => {
        const monthStr = `${selectedYear}-${String(month).padStart(2, '0')}`
        const targetVal = targets[`${productId}-${monthStr}`]
        try {
            await fetch(`http://localhost:8000/api/v1/settings/targets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    product_id: productId,
                    month: monthStr,
                    target: parseFloat(targetVal) || 95.0
                })
            })
            showNotification(`Target saved for ${months[month - 1]} ${selectedYear}`)
        } catch (error) {
            console.error("Failed to save target", error)
        }
    }

    const handleSaveAllTargets = async (productId) => {
        setLoading(true)
        try {
            for (let month = 1; month <= 12; month++) {
                const monthStr = `${selectedYear}-${String(month).padStart(2, '0')}`
                const targetVal = targets[`${productId}-${monthStr}`]
                if (targetVal !== undefined) {
                    await fetch(`http://localhost:8000/api/v1/settings/targets`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            product_id: productId,
                            month: monthStr,
                            target: parseFloat(targetVal) || 95.0
                        })
                    })
                }
            }
            showNotification(`All ${selectedYear} targets saved for ${productId}`)
        } catch (error) {
            console.error("Failed to save targets", error)
        } finally {
            setLoading(false)
        }
    }

    const showNotification = (msg) => {
        setNotification(msg)
        setTimeout(() => setNotification(null), 3000)
    }

    const activeProducts = products.filter(p => p.active)

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
                    <div style={{ marginBottom: '20px' }}>
                        <h3>Quick Info</h3>
                        <p style={{ color: 'var(--text-muted)', marginTop: '10px', fontSize: '0.9rem' }}>
                            Manage product visibility and set monthly yield targets below. Active products will appear in dashboards and analytics.
                        </p>
                    </div>
                    <div style={{
                        padding: '15px',
                        background: 'var(--bg-color)',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Total Products</span>
                            <span style={{ fontWeight: '600' }}>{products.length}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-muted)' }}>Active Products</span>
                            <span style={{ fontWeight: '600', color: 'var(--success-color)' }}>{activeProducts.length}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Yearly Yield Targets Section */}
            <div className="card" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Calendar size={20} color="var(--primary-color)" />
                        <h3>Yearly Yield Targets</h3>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                            onClick={() => setSelectedYear(y => y - 1)}
                            style={{
                                background: 'var(--bg-color)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <ChevronLeft size={18} color="var(--text-color)" />
                        </button>
                        <span style={{ fontWeight: '600', fontSize: '1.1rem', minWidth: '60px', textAlign: 'center' }}>
                            {selectedYear}
                        </span>
                        <button
                            onClick={() => setSelectedYear(y => y + 1)}
                            style={{
                                background: 'var(--bg-color)',
                                border: '1px solid var(--border-color)',
                                borderRadius: 'var(--radius-sm)',
                                padding: '8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                            }}
                        >
                            <ChevronRight size={18} color="var(--text-color)" />
                        </button>
                    </div>
                </div>

                {loading && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading targets...
                    </div>
                )}

                {activeProducts.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '20px', textAlign: 'center' }}>
                        No active products. Activate products above to set yield targets.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
                            <thead>
                                <tr>
                                    <th style={{
                                        textAlign: 'left',
                                        padding: '12px',
                                        borderBottom: '2px solid var(--border-color)',
                                        fontWeight: '600',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.85rem'
                                    }}>
                                        Product
                                    </th>
                                    {months.map((m, idx) => (
                                        <th key={m} style={{
                                            textAlign: 'center',
                                            padding: '8px 4px',
                                            borderBottom: '2px solid var(--border-color)',
                                            fontWeight: '600',
                                            color: 'var(--text-muted)',
                                            fontSize: '0.8rem'
                                        }}>
                                            {m}
                                        </th>
                                    ))}
                                    <th style={{
                                        textAlign: 'center',
                                        padding: '12px',
                                        borderBottom: '2px solid var(--border-color)',
                                        fontWeight: '600',
                                        color: 'var(--text-muted)',
                                        fontSize: '0.85rem'
                                    }}>
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {activeProducts.map(p => (
                                    <tr key={p.id}>
                                        <td style={{
                                            padding: '12px',
                                            borderBottom: '1px solid var(--border-color)',
                                            fontWeight: '500'
                                        }}>
                                            {p.name}
                                        </td>
                                        {months.map((m, idx) => {
                                            const month = idx + 1
                                            const key = `${p.id}-${selectedYear}-${String(month).padStart(2, '0')}`
                                            return (
                                                <td key={m} style={{
                                                    padding: '6px 4px',
                                                    borderBottom: '1px solid var(--border-color)',
                                                    textAlign: 'center'
                                                }}>
                                                    <input
                                                        type="number"
                                                        step="0.1"
                                                        min="0"
                                                        max="100"
                                                        value={targets[key] || ''}
                                                        onChange={(e) => handleTargetChange(p.id, month, e.target.value)}
                                                        style={{
                                                            width: '55px',
                                                            padding: '6px 4px',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            background: 'var(--bg-color)',
                                                            color: 'var(--text-color)',
                                                            textAlign: 'center',
                                                            fontSize: '0.85rem'
                                                        }}
                                                        placeholder="%"
                                                    />
                                                </td>
                                            )
                                        })}
                                        <td style={{
                                            padding: '12px',
                                            borderBottom: '1px solid var(--border-color)',
                                            textAlign: 'center'
                                        }}>
                                            <button
                                                className="btn-primary"
                                                onClick={() => handleSaveAllTargets(p.id)}
                                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                disabled={loading}
                                            >
                                                <Save size={14} style={{ marginRight: '4px' }} />
                                                Save All
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Settings
