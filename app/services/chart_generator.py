"""
Chart Generator Service
Generates Plotly charts as HTML for server-side rendering
"""
import plotly.graph_objects as go
from plotly.subplots import make_subplots
from typing import List, Dict, Any, Optional
from datetime import datetime


def aggregate_data(daily_trends: List[Dict], mode: str = "daily") -> List[Dict]:
    """Aggregate daily data by specified period"""
    if mode == "daily" or not daily_trends:
        return daily_trends
    
    month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                   'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    groups = {}
    for d in daily_trends:
        date = datetime.strptime(d["date"], "%Y-%m-%d") if isinstance(d["date"], str) else d["date"]
        
        if mode == "weekly":
            week_num = date.isocalendar()[1]
            key = f"{date.year}-W{week_num:02d}"
        elif mode == "monthly":
            key = f"{month_names[date.month - 1]} {date.year}"
        elif mode == "quarterly":
            quarter = (date.month - 1) // 3 + 1
            key = f"{date.year}-Q{quarter}"
        elif mode == "bylot":
            key = d.get("lot_id", d["date"])
        else:
            key = d["date"]
        
        if key not in groups:
            groups[key] = {"yields": [], "bin_stats_sum": {}, "bin_stats_count": {}}
        
        groups[key]["yields"].append(d["mean_yield"])
        
        if d.get("bin_stats"):
            for bin_name, value in d["bin_stats"].items():
                if bin_name not in groups[key]["bin_stats_sum"]:
                    groups[key]["bin_stats_sum"][bin_name] = 0
                    groups[key]["bin_stats_count"][bin_name] = 0
                groups[key]["bin_stats_sum"][bin_name] += value
                groups[key]["bin_stats_count"][bin_name] += 1
    
    result = []
    for key, val in sorted(groups.items()):
        avg_bin_stats = {}
        for bin_name in val["bin_stats_sum"]:
            avg_bin_stats[bin_name] = round(
                val["bin_stats_sum"][bin_name] / val["bin_stats_count"][bin_name]
            )
        
        result.append({
            "date": key,
            "mean_yield": sum(val["yields"]) / len(val["yields"]),
            "bin_stats": avg_bin_stats
        })
    
    return result


def generate_yield_trend_chart(
    data: Dict[str, Any],
    aggregation: str = "daily",
    include_plotlyjs: str = "cdn"
) -> str:
    """
    Generate yield trend chart HTML with Plotly
    
    Args:
        data: Yield data with daily_trends and statistics
        aggregation: "daily", "weekly", "monthly", "quarterly", "bylot"
        include_plotlyjs: "cdn", True (embed), or False (assume already loaded)
    
    Returns:
        HTML string with the chart
    """
    daily_trends = data.get("daily_trends", [])
    statistics = data.get("statistics", {})
    
    if not daily_trends:
        return '<div class="loading">No data available</div>'
    
    # Aggregate data
    aggregated = aggregate_data(daily_trends, aggregation)
    
    dates = [d["date"] for d in aggregated]
    yields = [d["mean_yield"] for d in aggregated]
    target = statistics.get("target")  # Can be None
    
    # Calculate dynamic y-axis range
    min_yield = min(yields) if yields else 0
    max_yield = max(yields) if yields else 100
    if target is not None:
        min_yield = min(min_yield, target)
        max_yield = max(max_yield, target)
    # Add 5% padding on each side
    y_range_min = max(0, min_yield - 5)
    y_range_max = min(100, max_yield + 5)
    
    # Collect all fail bins
    all_bins = set()
    for d in aggregated:
        if d.get("bin_stats"):
            for k in d["bin_stats"]:
                if "Pass" not in k and not k.startswith("1_"):
                    all_bins.add(k)
    
    # Create figure
    fig = go.Figure()
    
    # Yield line (left axis)
    fig.add_trace(go.Scatter(
        x=dates,
        y=yields,
        mode='lines+markers',
        name='Yield (%)',
        marker=dict(color='#3b82f6', size=6),
        line=dict(width=3),
        yaxis='y1'
    ))
    
    # Target line (only if target is set)
    if target is not None:
        fig.add_trace(go.Scatter(
            x=[dates[0], dates[-1]],
            y=[target, target],
            mode='lines',
            name='Target',
            line=dict(color='#10b981', dash='dash', width=2),
            hoverinfo='skip',
            yaxis='y1'
        ))
    
    # Fail bin bars (right axis)
    colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1']
    for idx, bin_name in enumerate(sorted(all_bins)):
        bin_values = [d.get("bin_stats", {}).get(bin_name, 0) for d in aggregated]
        fig.add_trace(go.Bar(
            x=dates,
            y=bin_values,
            name=bin_name,
            marker=dict(color=colors[idx % len(colors)]),
            yaxis='y2',
            opacity=0.7
        ))
    
    # Layout
    axis_label = {
        "daily": "Daily",
        "weekly": "Weekly", 
        "monthly": "Monthly",
        "quarterly": "Quarterly",
        "bylot": "Lot ID"
    }.get(aggregation, "Date")
    
    fig.update_layout(
        autosize=True,
        margin=dict(l=50, r=50, t=30, b=50),
        xaxis=dict(
            title=dict(text=axis_label, font=dict(color='#94a3b8')),
            gridcolor='rgba(128, 128, 128, 0.2)',
            tickfont=dict(color='#94a3b8')
        ),
        yaxis=dict(
            title=dict(text='Yield (%)', font=dict(color='#3b82f6')),
            range=[y_range_min, y_range_max],
            gridcolor='rgba(128, 128, 128, 0.2)',
            zerolinecolor='rgba(128, 128, 128, 0.2)',
            tickfont=dict(color='#3b82f6')
        ),
        yaxis2=dict(
            title=dict(text='Fail Count', font=dict(color='#ef4444')),
            tickfont=dict(color='#ef4444'),
            overlaying='y',
            side='right',
            showgrid=False
        ),
        barmode='stack',
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        showlegend=True,
        legend=dict(
            orientation="h",
            y=1.12,
            font=dict(color='#94a3b8')
        )
    )
    
    return fig.to_html(
        include_plotlyjs=include_plotlyjs,
        full_html=False,
        config={'displayModeBar': False}
    )


def generate_fail_ratio_chart(
    data: Dict[str, Any],
    include_plotlyjs: str = False
) -> str:
    """Generate fail ratio pie chart HTML"""
    daily_trends = data.get("daily_trends", [])
    
    if not daily_trends:
        return '<div class="loading">No fail data available</div>'
    
    # Calculate fail totals
    all_bins = {}
    total_fails = 0
    
    for d in daily_trends:
        if d.get("bin_stats"):
            for bin_name, value in d["bin_stats"].items():
                if "Pass" not in bin_name and not bin_name.startswith("1_"):
                    if bin_name not in all_bins:
                        all_bins[bin_name] = 0
                    all_bins[bin_name] += value
                    total_fails += value
    
    if total_fails == 0:
        return '<div class="loading">No fail data available</div>'
    
    labels = list(all_bins.keys())
    values = list(all_bins.values())
    colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1']
    
    fig = go.Figure(data=[go.Pie(
        labels=labels,
        values=values,
        hole=0.4,
        marker=dict(colors=colors[:len(labels)]),
        textinfo='label+percent',
        textfont=dict(color='#f1f5f9')
    )])
    
    fig.update_layout(
        autosize=True,
        height=250,
        margin=dict(l=10, r=10, t=10, b=10),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        showlegend=False
    )
    
    return fig.to_html(
        include_plotlyjs=include_plotlyjs,
        full_html=False,
        config={'displayModeBar': False, 'responsive': True}
    )


def generate_wafer_svg(wafer_data: Dict[str, Any], size: int = 100) -> str:
    """
    Generate SVG for a single wafer map
    
    Args:
        wafer_data: Dict with x, y, bin arrays and wafer_id
        size: SVG size in pixels
    
    Returns:
        SVG string
    """
    x_coords = wafer_data.get("x", [])
    y_coords = wafer_data.get("y", [])
    bins = wafer_data.get("bin", [])
    
    if not x_coords:
        return f'<svg width="{size}" height="{size}"><text x="50%" y="50%" text-anchor="middle">No data</text></svg>'
    
    # Calculate scaling
    min_x, max_x = min(x_coords), max(x_coords)
    min_y, max_y = min(y_coords), max(y_coords)
    range_x = max_x - min_x or 1
    range_y = max_y - min_y or 1
    
    padding = 5
    usable_size = size - 2 * padding
    chip_size = min(usable_size / (range_x + 1), usable_size / (range_y + 1)) * 0.9
    
    # Color mapping
    bin_colors = {
        1: "#10b981",  # Pass - green
        3: "#ef4444",  # Bin 3 - red
        7: "#f59e0b",  # Bin 7 - yellow
    }
    default_color = "#8b5cf6"  # Other - purple
    
    svg_parts = [f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}">']
    
    for i in range(len(x_coords)):
        x = padding + ((x_coords[i] - min_x) / range_x) * usable_size
        y = padding + ((y_coords[i] - min_y) / range_y) * usable_size
        color = bin_colors.get(bins[i], default_color)
        
        svg_parts.append(
            f'<rect x="{x:.1f}" y="{y:.1f}" '
            f'width="{chip_size:.1f}" height="{chip_size:.1f}" '
            f'fill="{color}" rx="1"/>'
        )
    
    svg_parts.append('</svg>')
    return ''.join(svg_parts)


def generate_wafer_map_detail(wafer_data: Dict[str, Any]) -> str:
    """Generate larger Plotly chart for wafer detail modal"""
    x_coords = wafer_data.get("x", [])
    y_coords = wafer_data.get("y", [])
    bins = wafer_data.get("bin", [])
    wafer_id = wafer_data.get("wafer_id", "Unknown")
    lot_id = wafer_data.get("lot_id", "")
    
    bin_colors = {
        1: "#10b981",
        3: "#ef4444", 
        7: "#f59e0b",
    }
    colors = [bin_colors.get(b, "#8b5cf6") for b in bins]
    
    fig = go.Figure(data=go.Scatter(
        x=x_coords,
        y=y_coords,
        mode='markers',
        marker=dict(
            size=8,
            symbol='square',
            color=colors
        ),
        hoverinfo='x+y+text',
        text=[f'Bin {b}' for b in bins]
    ))
    
    fig.update_layout(
        autosize=True,
        width=480,
        height=480,
        margin=dict(l=10, r=10, t=30, b=10),
        title=dict(text=f'Wafer #{wafer_id} ({lot_id})', font=dict(color='#f1f5f9', size=14)),
        xaxis=dict(
            showgrid=False,
            zeroline=False,
            showticklabels=False,
            range=[-16, 16],
            constrain='domain'
        ),
        yaxis=dict(
            showgrid=False,
            zeroline=False,
            showticklabels=False,
            scaleanchor="x",
            scaleratio=1,
            range=[-16, 16],
            constrain='domain'
        ),
        paper_bgcolor='rgba(0,0,0,0)',
        plot_bgcolor='rgba(0,0,0,0)',
        showlegend=False
    )
    
    return fig.to_html(
        include_plotlyjs=False,
        full_html=False,
        config={'displayModeBar': False, 'responsive': True}
    )
