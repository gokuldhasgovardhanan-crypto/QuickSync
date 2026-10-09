import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from .core.config import settings
from .core.database import engine, Base, SessionLocal
from .core.logging import logger, log_event
from .services.auth_service import AuthService
from .websocket.manager import ws_manager

# Import API Routers
from .api.auth import router as auth_router
from .api.live import router as live_router
from .api.products import router as products_router
from .api.prices import router as prices_router
from .api.inventory import router as inventory_router
from .api.delivery import router as delivery_router
from .api.monitoring import router as monitoring_router
from .api.alerts import router as alerts_router
from .api.sync import router as sync_router
from .api.data_quality import router as data_quality_router
from .api.sources import router as sources_router
from .api.settings import router as settings_router
from .api.comparison import router as comparison_router
from .api.traceability import router as traceability_router
from .api.locations import router as locations_router
from .api.admin import router as admin_router
from .api.demand import router as demand_router
from .api.export import router as export_router
from .api.matching import router as matching_router
from .api.regional import router as regional_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables and seed default baseline data
    logger.info("Starting QuickSync Infrastructure Engine...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        AuthService.seed_defaults(db)
        logger.info("QuickSync database baseline initialized and seeded.")
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
    finally:
        db.close()
        
    yield
    logger.info("Shutting down QuickSync Engine.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.TAGLINE,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(live_router, prefix="/api")
app.include_router(matching_router, prefix="/api")
app.include_router(export_router, prefix="/api")
app.include_router(regional_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(prices_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(delivery_router, prefix="/api")
app.include_router(monitoring_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(sync_router, prefix="/api")
app.include_router(data_quality_router, prefix="/api")
app.include_router(sources_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
app.include_router(comparison_router, prefix="/api")
app.include_router(traceability_router, prefix="/api")
app.include_router(locations_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(demand_router, prefix="/api")

# WebSocket Endpoint
@app.websocket("/api/ws/live")
@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep receiving client heartbeats or messages
            data = await websocket.receive_text()
            # Echo ping-pong or handle subscriptions
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        ws_manager.disconnect(websocket)

@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "QuickSync Backend Engine",
        "version": settings.VERSION
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
