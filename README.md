CoupleAppProject 실행방법 안내

개발환경
- Mac
- iOS Simulator 
- Node.js (v20 이상)
- MySQL 8.x
- React Native (Expo)

서버 실행 방법
1. MySQL DB 생성 및 테이블 생성 (초기 DDL 별도 제공)
2. couple-backend 폴더로 이동하여: npm install
3. server.js 내 mysql.createConnection 부분을 본인 MySQL 환경에 맞게 수정
4. 서버 실행: node server.js
(포트는 3000번 기본 사용)

클라이언트 실행 방법 
1.npm install
2. Expo 개발서버 실행: npx expo start --ios
3. 앱 실행 (Expo Go 이용 가능)


###주의
- server.js에 DB 비밀번호를 반드시 본인 환경에 맞게 수정 필요
- localhost가 아닌 경우, 서버 IP를 프론트 axios URL에 맞춰 수정
- .env 파일 없이 localhost:3000 으로 통신됨.
- 서버/앱 모두 동일 PC(mac)에서 실행하는 것을 가정.
- 본 프로젝트는 Mac + iOS Simulator를 기준으로 동작 확인하였음.
- Expo CLI 설치가 필요할 수 있음 (최초 1회만): npm install -g expo-cli

회원가입 후 커플정보 - 커플등록 가능, 상대방의 UID 입력으로 커플등록
커플 등록 후 함께 이동한 거리, 시간에 따른 코인 지급으로 펫 아이템 구매 가능.
만나서 함께 있고, 이동한 거리에 따라 코인 지급
위치 정보 공유 스위치로 상대방에게 나의 실시간 위치 공유 on/off 가능
로직에 따라 뱃지 획득 가능
