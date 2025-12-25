"""
Views module for rendering HTML pages with Jinja2 templates
"""
from fastapi import APIRouter, Request, Query
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from typing import Optional, List
from datetime import date, timedelta

from app.api.deps import get_db_service
from app.services.chart_generator import (
    generate_yield_trend_chart,
    generate_fail_ratio_chart,
    generate_wafer_svg,
    generate_wafer_map_detail
)
from app.services.mock_db import mock_settings_service
from app.services.analytics import analytics_service
from app.core.config import settings as app_settings

def get_products_list():
    """Get products from Oracle or Mock based on settings"""
    if app_settings.USE_MOCK_DB:
        return mock_settings_service.get_products()
    else:
        from app.services.oracle_db import oracle_db_service
        return oracle_db_service.get_products()

router = APIRouter()
templates = Jinja2Templates(directory="templates")


# ==================== Dashboard ====================

@router.get("/", response_class=HTMLResponse)
async def dashboard(
    request: Request,
    product_id: Optional[str] = None,
    aggregation: str = "daily"
):
    """Main dashboard page"""
    products = get_products_list()
    active_products = [p for p in products if p.get("active", True)]
    
    if not product_id and active_products:
        product_id = active_products[0]["id"]
    
    # Get yield data
    data = {}
    if product_id:
        db_service = get_db_service()
        end_date = date.today()
        start_date = end_date - timedelta(days=30)
        data = db_service.get_cp_yield_trend(product_id, start_date, end_date)
        stats = analytics_service.calculate_yield_stats(data)
        target = mock_settings_service.get_target(product_id)
        stats['target'] = target
        data = {"daily_trends": stats.get("daily_trends", []), "statistics": stats}
    
    # Generate charts
    yield_chart_html = generate_yield_trend_chart(data, aggregation) if data else ""
    fail_ratio_chart_html = generate_fail_ratio_chart(data) if data else ""
    
    # Calculate fail ratio data for the list
    fail_ratio_data = calculate_fail_ratio_list(data)
    
    return templates.TemplateResponse("pages/dashboard.html", {
        "request": request,
        "active_page": "dashboard",
        "page_title": "Yield Overview",
        "products": active_products,
        "selected_product": product_id,
        "aggregation": aggregation,
        "statistics": data.get("statistics", {}),
        "yield_chart_html": yield_chart_html,
        "fail_ratio_chart_html": fail_ratio_chart_html,
        "fail_ratio_data": fail_ratio_data
    })


@router.get("/partials/dashboard-content", response_class=HTMLResponse)
async def dashboard_content_partial(
    request: Request,
    product_id: str,
    aggregation: str = "daily"
):
    """Partial for dashboard content (HTMX)"""
    db_service = get_db_service()
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    data = db_service.get_cp_yield_trend(product_id, start_date, end_date)
    stats = analytics_service.calculate_yield_stats(data)
    target = mock_settings_service.get_target(product_id)
    stats['target'] = target
    data = {"daily_trends": stats.get("daily_trends", []), "statistics": stats}
    
    yield_chart_html = generate_yield_trend_chart(data, aggregation)
    fail_ratio_chart_html = generate_fail_ratio_chart(data)
    fail_ratio_data = calculate_fail_ratio_list(data)
    
    return templates.TemplateResponse("partials/dashboard_content.html", {
        "request": request,
        "aggregation": aggregation,
        "statistics": stats,
        "yield_chart_html": yield_chart_html,
        "fail_ratio_chart_html": fail_ratio_chart_html,
        "fail_ratio_data": fail_ratio_data
    })


@router.get("/partials/yield-chart", response_class=HTMLResponse)
async def yield_chart_partial(
    request: Request,
    product_id: str,
    aggregation: str = "daily"
):
    """Partial for yield chart only (HTMX)"""
    db_service = get_db_service()
    end_date = date.today()
    start_date = end_date - timedelta(days=30)
    
    data = db_service.get_cp_yield_trend(product_id, start_date, end_date)
    stats = analytics_service.calculate_yield_stats(data)
    target = mock_settings_service.get_target(product_id)
    stats['target'] = target
    data = {"daily_trends": stats.get("daily_trends", []), "statistics": stats}
    
    return generate_yield_trend_chart(data, aggregation, include_plotlyjs=False)


# ==================== Wafer Map ====================

@router.get("/wafermap", response_class=HTMLResponse)
async def wafermap(
    request: Request,
    product_id: Optional[str] = None
):
    """Wafer map viewer page"""
    products = get_products_list()
    active_products = [p for p in products if p.get("active", True)]
    
    if not product_id and active_products:
        product_id = active_products[0]["id"]
    
    # Get lots for product
    db_service = get_db_service()
    lots = db_service.get_lots_for_product(product_id) if product_id else []
    selected_lots = [lots[0]] if lots else []
    
    # Get wafer maps for selected lots
    wafer_maps = {}
    for lot_id in selected_lots:
        maps = db_service.get_wafer_maps(lot_id)
        wafer_maps[lot_id] = [
            {**m, "svg": generate_wafer_svg(m, size=90)}
            for m in maps
        ]
    
    return templates.TemplateResponse("pages/wafermap.html", {
        "request": request,
        "active_page": "wafermap",
        "page_title": "Wafer Map Viewer",
        "products": active_products,
        "selected_product": product_id,
        "lots": lots,
        "selected_lots": selected_lots,
        "wafer_maps": wafer_maps
    })


@router.get("/partials/wafer-lots", response_class=HTMLResponse)
async def wafer_lots_partial(
    request: Request,
    product_id: str
):
    """Partial for lot selection (HTMX)"""
    db_service = get_db_service()
    lots = db_service.get_lots_for_product(product_id)
    
    return templates.TemplateResponse("partials/wafer_lots.html", {
        "request": request,
        "lots": lots,
        "selected_lots": [lots[0]] if lots else []
    })


@router.get("/partials/wafer-maps", response_class=HTMLResponse)
async def wafer_maps_partial(
    request: Request,
    product_id: str,
    lot_id: List[str] = Query(default=[])
):
    """Partial for wafer maps grid (HTMX)"""
    db_service = get_db_service()
    
    wafer_maps = {}
    for lid in lot_id:
        maps = db_service.get_wafer_maps(lid)
        wafer_maps[lid] = [
            {**m, "svg": generate_wafer_svg(m, size=90)}
            for m in maps
        ]
    
    return templates.TemplateResponse("partials/wafer_maps.html", {
        "request": request,
        "wafer_maps": wafer_maps
    })


@router.get("/partials/wafer-detail", response_class=HTMLResponse)
async def wafer_detail_partial(
    request: Request,
    wafer_id: str,
    lot_id: str
):
    """Partial for wafer detail modal (HTMX)"""
    db_service = get_db_service()
    maps = db_service.get_wafer_maps(lot_id)
    
    wafer_data = next((m for m in maps if str(m.get("wafer_id")) == wafer_id), None)
    if wafer_data:
        wafer_data["lot_id"] = lot_id
        return HTMLResponse(content=generate_wafer_map_detail(wafer_data))
    
    return HTMLResponse(content="<div>Wafer not found</div>")


# ==================== Settings ====================

@router.get("/settings", response_class=HTMLResponse)
async def settings(
    request: Request,
    year: Optional[int] = None
):
    """Settings page"""
    from datetime import datetime
    
    if year is None:
        year = datetime.now().year
    
    products = get_products_list()
    
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    # Get targets for all active products
    targets = {}
    for product in products:
        if product["active"]:
            for month in range(1, 13):
                month_str = f"{year}-{month:02d}"
                target = mock_settings_service.get_target(product["id"], month_str)
                targets[f"{product['id']}-{month_str}"] = target
    
    return templates.TemplateResponse("pages/settings.html", {
        "request": request,
        "active_page": "settings",
        "page_title": "Settings",
        "products": products,
        "selected_year": year,
        "months": months,
        "targets": targets
    })


@router.post("/partials/toggle-product", response_class=HTMLResponse)
async def toggle_product_partial(request: Request):
    """Toggle product active state and return updated product list HTML"""
    form_data = await request.form()
    product_id = form_data.get("product_id")
    active_str = form_data.get("active", "false")
    active = active_str.lower() == "true"
    
    # Toggle the product
    mock_settings_service.toggle_product(product_id, active)
    
    # Return updated product list
    products = mock_settings_service.get_products()
    
    return templates.TemplateResponse("partials/product_list.html", {
        "request": request,
        "products": products
    })


# ==================== Helper Functions ====================

def calculate_fail_ratio_list(data: dict) -> list:
    """Calculate fail ratio data for display list"""
    daily_trends = data.get("daily_trends", [])
    if not daily_trends:
        return []
    
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
        return []
    
    colors = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1']
    result = []
    for idx, (name, count) in enumerate(sorted(all_bins.items(), key=lambda x: -x[1])):
        result.append({
            "name": name,
            "count": int(round(count)),
            "ratio": f"{(count / total_fails) * 100:.1f}",
            "color": colors[idx % len(colors)]
        })
    
    return result
