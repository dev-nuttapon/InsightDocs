import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(function (_a) {
    var command = _a.command;
    return ({
        base: command === 'build' ? '/InsightDocs/' : '/',
        plugins: [react()],
        server: {
            host: '0.0.0.0',
            port: 5173,
        },
    });
});
