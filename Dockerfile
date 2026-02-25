# OKX 现货 AI 分析系统 V2.0 - Docker 镜像
# 基于 Node.js 20 Alpine 轻量版本
FROM node:20-alpine

WORKDIR /app

# 安装 OpenSSL（Prisma 需要）
RUN apk add --no-cache openssl

# 先复制依赖文件（利用 Docker 层缓存）
COPY package*.json ./

# 安装生产依赖
RUN npm ci --production

# 复制编译产物和必要文件
COPY dist/ ./dist/
COPY prisma/ ./prisma/
COPY src/public/ ./src/public/

# 生成 Prisma Client
RUN npx prisma generate

# 暴露服务端口
EXPOSE 6000

# 启动命令
CMD ["node", "dist/index.js"]
