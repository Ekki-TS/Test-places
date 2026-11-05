from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from responses import success_response, error_response
from routers import auth_router

app = FastAPI(title="Restaurant Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Lỗi 401, 403... ném từ dependencies cũng trả về đúng định dạng 6 trường
@app.exception_handler(HTTPException)
def http_exception_handler(request: Request, exc: HTTPException):
    return error_response(request, str(exc.detail), "HTTP " + str(exc.status_code), exc.status_code)


# Mỗi người chỉ thêm ĐÚNG 1 DÒNG include_router của module mình ở đây.
app.include_router(auth_router.router)


@app.get("/")
def root(request: Request):
    return success_response(request, "Restaurant API is running")