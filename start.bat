@echo off
echo Starting Podman Compose with build...
docker-compose up --build

echo.
echo Podman Compose has stopped. Press any key to exit.
pause >nul
