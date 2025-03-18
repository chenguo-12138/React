import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", ".json", ".less", ".css"],
    alias: {
      "@": resolve(__dirname, "src"),
      public: resolve(__dirname, "public"),
    },
  },
  build: {
    // 设置输出目录
    outDir: "dist",
    // 清空输出目录
    emptyOutDir: true,
    // 启用CSS代码分割
    cssCodeSplit: true,
    // 启用源码映射
    sourcemap: false, // 生产环境通常设为false
    // 设置chunk大小警告的限制
    chunkSizeWarningLimit: 1500,
    // 压缩选项
    // minify: "terser",
    // terserOptions: {
    //   compress: {
    //     drop_console: true, // 移除console
    //     drop_debugger: true, // 移除debugger
    //   },
    // },
    rollupOptions: {
      output: {
        // 将JS文件输出到js目录
        entryFileNames: "assets/js/[name]-[hash].js",
        // 将代码分割的chunk输出到js目录
        chunkFileNames: "assets/js/[name]-[hash].js",
        // 将静态资源输出到对应目录
        assetFileNames: (assetInfo) => {
          console.log("assetinfo====", assetInfo);
          const info = assetInfo.name?.split(".") || [];
          let extType = info[info.length - 1];

          if (
            assetInfo.name &&
            /\.(png|bmp|jpg|jpeg|gif|svg)$/.test(assetInfo.name)
          ) {
            extType = "img";
          } else if (
            assetInfo.name &&
            /\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)
          ) {
            extType = "fonts";
          } else if (
            assetInfo.name &&
            /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name)
          ) {
            extType = "media";
          } else if (assetInfo.name && /\.css$/.test(assetInfo.name)) {
            extType = "css";
          }

          return `assets/${extType}/[name]-[hash].[ext]`;
        },
      },
    },
  },
});
