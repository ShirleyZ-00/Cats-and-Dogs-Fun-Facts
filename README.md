# 猫狗冷知识乐园（Vercel 版）

一个免登录的卡通风网站：

- 点击按钮随机刷新猫猫/狗狗冷知识
- 对当前冷知识向 Gemini 提问并获取回答

## 本地运行（可选）

```bash
node server.js
```

打开 `http://localhost:3000`

> 本地模式使用 `server.js`。  
> Vercel 部署模式使用 `api/*.js` Serverless 路由。

## 部署到 Vercel

1. 把项目推送到 GitHub（确保 `.env` 没有提交）。
2. 在 Vercel 导入该 GitHub 仓库。
3. 在 Vercel 项目设置里添加环境变量：
   - `GEMINI_API_KEY` = 你的 Gemini Key
4. 点击 Redeploy。

部署成功后访问域名即可使用。
