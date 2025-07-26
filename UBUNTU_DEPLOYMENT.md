# 우분투 서버 배포 가이드

이 가이드는 Naver Flight Monitoring 프로젝트를 우분투 서버에 배포하고 `/monitor/random` 엔드포인트를 10초마다 호출하도록 설정하는 방법을 설명합니다.

## 🚀 빠른 배포

### 1. 프로젝트 다운로드
```bash
# 서버에 SSH 접속 후
cd /tmp
git clone https://github.com/your-username/mrt-naver-benchmark.git
cd mrt-naver-benchmark
```

### 2. 배포 스크립트 실행
```bash
# 배포 스크립트 실행 권한 부여
chmod +x deploy.sh

# 빠른 배포 (권장)
./deploy.sh

# 또는 패키지 업데이트 포함 배포
UPDATE_PACKAGES=true ./deploy.sh
```

### 3. 환경 설정
```bash
# 환경 파일 편집
nano /opt/naver-flight-monitoring/.env
```

다음 내용을 설정하세요:
```env
SUPABASE_KEY=your_actual_supabase_key
NODE_ENV=production
PORT=3000
```

### 4. 애플리케이션 재시작
```bash
# PM2로 애플리케이션 재시작
pm2 restart naver-flight-monitoring
```

## 📋 수동 배포 (선택사항)

### 1. 시스템 패키지 업데이트 (선택사항)
```bash
# 빠른 배포 (패키지 업데이트 없음)
./deploy.sh

# 전체 패키지 업데이트 포함
UPDATE_PACKAGES=true ./deploy.sh

# 또는 수동으로 업데이트
sudo apt update && sudo apt upgrade -y
```

### 2. Node.js 설치
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 3. PM2 설치
```bash
sudo npm install -g pm2
```

### 4. Nginx 설치
```bash
sudo apt install -y nginx
```

### 5. 프로젝트 설정
```bash
# 애플리케이션 디렉토리 생성
sudo mkdir -p /opt/naver-flight-monitoring
sudo chown $USER:$USER /opt/naver-flight-monitoring

# 프로젝트 파일 복사
cp -r . /opt/naver-flight-monitoring/
cd /opt/naver-flight-monitoring

# 의존성 설치
npm install --production
```

### 6. 환경 변수 설정
```bash
cp env.example .env
nano .env
```

### 7. PM2 설정
```bash
# PM2 ecosystem 파일 생성
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'naver-flight-monitoring',
    script: 'src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

# 로그 디렉토리 생성
mkdir -p logs

# PM2로 애플리케이션 시작
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### 8. Nginx 설정
```bash
# Nginx 설정 파일 생성
sudo tee /etc/nginx/sites-available/naver-flight-monitoring << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 사이트 활성화
sudo ln -sf /etc/nginx/sites-available/naver-flight-monitoring /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx 설정 테스트 및 재시작
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 9. 모니터링 스크립트 설정
```bash
# 모니터링 스크립트 생성
cat > monitor.sh << 'EOF'
#!/bin/bash

# Script to call /monitor/random endpoint every 10 seconds
BASE_URL="http://localhost:3000"

while true; do
    echo "$(date): Calling /api/flights/monitor/random..."
    
    # Call the random monitoring endpoint
    response=$(curl -s -X POST "$BASE_URL/api/flights/monitor/random" \
        -H "Content-Type: application/json" \
        -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}s")
    
    # Extract HTTP status and response time
    http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
    response_time=$(echo "$response" | grep "TIME:" | cut -d: -f2)
    
    if [ "$http_status" = "200" ]; then
        echo "✅ Success - Status: $http_status, Time: ${response_time}s"
    else
        echo "❌ Failed - Status: $http_status, Time: ${response_time}s"
        echo "Response: $response"
    fi
    
    echo "----------------------------------------"
    
    # Wait 10 seconds
    sleep 10
done
EOF

chmod +x monitor.sh
```

### 10. Systemd 서비스 생성
```bash
# Systemd 서비스 파일 생성
sudo tee /etc/systemd/system/naver-flight-monitor.service << EOF
[Unit]
Description=Naver Flight Monitoring Scheduler
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=/opt/naver-flight-monitoring
ExecStart=/opt/naver-flight-monitoring/monitor.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 서비스 활성화 및 시작
sudo systemctl daemon-reload
sudo systemctl enable naver-flight-monitor.service
sudo systemctl start naver-flight-monitor.service
```

## 🔧 관리 명령어

### 애플리케이션 관리
```bash
# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs naver-flight-monitoring

# 애플리케이션 재시작
pm2 restart naver-flight-monitoring

# 애플리케이션 중지
pm2 stop naver-flight-monitoring

# 애플리케이션 시작
pm2 start naver-flight-monitoring
```

### 모니터링 서비스 관리
```bash
# 모니터링 서비스 상태 확인
sudo systemctl status naver-flight-monitor.service

# 모니터링 서비스 로그 확인
sudo journalctl -u naver-flight-monitor.service -f

# 모니터링 서비스 중지
sudo systemctl stop naver-flight-monitor.service

# 모니터링 서비스 시작
sudo systemctl start naver-flight-monitor.service

# 모니터링 서비스 재시작
sudo systemctl restart naver-flight-monitor.service
```

### Nginx 관리
```bash
# Nginx 상태 확인
sudo systemctl status nginx

# Nginx 재시작
sudo systemctl restart nginx

# Nginx 설정 테스트
sudo nginx -t
```

## 📊 모니터링 확인

### 1. 애플리케이션 접속
- 대시보드: `http://your-server-ip`
- API: `http://your-server-ip/api`
- 헬스 체크: `http://your-server-ip/api/data/health`

### 2. 로그 확인
```bash
# 애플리케이션 로그
pm2 logs naver-flight-monitoring

# 모니터링 서비스 로그
sudo journalctl -u naver-flight-monitor.service -f

# Nginx 로그
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### 3. 데이터베이스 확인
Supabase 대시보드에서 다음 테이블을 확인할 수 있습니다:
- `flight_monitoring_records`: 모니터링 기록
- `api_call_logs`: API 호출 로그

## 🛠️ 문제 해결

### 애플리케이션이 시작되지 않는 경우
```bash
# 로그 확인
pm2 logs naver-flight-monitoring

# 환경 변수 확인
cat /opt/naver-flight-monitoring/.env

# 수동으로 애플리케이션 실행 테스트
cd /opt/naver-flight-monitoring
node src/server.js
```

### 모니터링이 작동하지 않는 경우
```bash
# 서비스 상태 확인
sudo systemctl status naver-flight-monitor.service

# 로그 확인
sudo journalctl -u naver-flight-monitor.service -f

# 수동으로 스크립트 실행 테스트
cd /opt/naver-flight-monitoring
./monitor.sh
```

### Nginx 오류가 발생하는 경우
```bash
# Nginx 설정 테스트
sudo nginx -t

# Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log

# 방화벽 설정 확인
sudo ufw status
```

## 🔒 보안 고려사항

1. **방화벽 설정**: 필요한 포트만 열어두세요
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS (SSL 사용 시)
   sudo ufw enable
   ```

2. **SSL 인증서**: 프로덕션에서는 Let's Encrypt를 사용하여 SSL 인증서를 설정하세요

3. **환경 변수 보안**: `.env` 파일의 권한을 제한하세요
   ```bash
   chmod 600 /opt/naver-flight-monitoring/.env
   ```

4. **정기 업데이트**: 시스템과 애플리케이션을 정기적으로 업데이트하세요

## 📈 성능 최적화

1. **PM2 클러스터 모드**: CPU 코어 수에 따라 인스턴스 수 조정
2. **Nginx 캐싱**: 정적 파일에 대한 캐싱 설정
3. **데이터베이스 최적화**: Supabase 인덱스 및 쿼리 최적화
4. **모니터링 간격 조정**: 필요에 따라 호출 간격 조정 (현재 10초)

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 로그 파일 확인
2. 환경 변수 설정 확인
3. 네트워크 연결 확인
4. 데이터베이스 연결 확인 