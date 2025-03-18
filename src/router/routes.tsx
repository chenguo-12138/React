import { AppleOutlined, HomeOutlined, SmileOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { lazy, ReactNode, Suspense } from "react";
import { Navigate, Outlet, RouteObject } from "react-router-dom";

const Login = lazy(() => import("@/pages/Login/Login"));
const Hart = lazy(() => import("@/pages/ThreeJs/Hart/Hart"));
const Layout = lazy(() => import("@/pages/Layout/Layout"));

const Load = ({ Component }: { Component: React.ReactNode }) => {
  return (
    <Suspense
      fallback={
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "30px 50px",
            borderRadius: "4px",
          }}
        >
          <Spin />
        </div>
      }
    >
      {Component}
    </Suspense>
  );
};
// 扩展路由配置类型
export type AppRouteObject = RouteObject & {
  path: string;
  element?: React.ReactNode;
  children?: AppRouteObject[];
  meta?: {
    title?: string; // 菜单标题
    icon?: ReactNode; // 菜单图标
    hideInMenu?: boolean; // 是否在菜单中隐藏
    hideChildrenInMenu?: boolean; // 是否隐藏子菜单
    auth?: string[]; // 权限配置
  };
};

const Router: Array<AppRouteObject> = [
  {
    path: "/",
    element: <Navigate to="/threejs" />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "threejs",
        element: <Load Component={<Outlet />} />,
        meta: {
          title: "threejs",
          icon: <HomeOutlined />,
        },
        children: [
          {
            path: "",
            element: <Navigate to="hart" replace />,
          },
          {
            path: "hart",
            element: <Load Component={<Hart />} />,
            meta: {
              title: "爱心💗",
              icon: <SmileOutlined />,
            },
          },
        ],
      },
      {
        path: "G6",
        element: <>G6</>,
        meta: {
          title: "G6",
          icon: <AppleOutlined />,
        },
      },
    ],
  },
  {
    path: "login",
    element: <Load Component={<Login />} />,
  },
];

export default Router;
