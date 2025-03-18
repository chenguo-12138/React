import { Menu } from "antd";
import type { MenuProps } from "antd";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import type { AppRouteObject } from "@/router/routes";
import routes from "@/router/routes";

const SideMenu: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  // 获取当前用户权限（示例）
  const userRoles = ["admin"]; // 这里应该从用户状态获取

  // 检查权限
  const hasPermission = (route: AppRouteObject) => {
    if (!route.meta?.auth) return true;
    return route.meta.auth.some((role) => userRoles.includes(role));
  };

  // 将路由转换为菜单项
  const getMenuItems = (
    routes: AppRouteObject[],
    parentPath?: string
  ): MenuProps["items"] => {
    return routes
      .filter((route) => {
        //过滤掉重定向
        if (!route.path) return false;
        // 过滤掉不显示在菜单中的路由
        if (route.meta?.hideInMenu) return false;
        // 检查权限
        if (!hasPermission(route)) return false;
        return true;
      })
      .map((route) => {
        const prefix = route.path.startsWith("/") ? "" : "/";
        let fullPath = `${prefix}${route.path}`;

        //子路由路径处理
        if (parentPath) {
          fullPath =
            (parentPath.startsWith("/") ? parentPath : `/${parentPath}`) +
            fullPath;
        }

        // 处理子菜单
        const hasChildren = route.children && !route.meta?.hideChildrenInMenu;
        const children = hasChildren
          ? getMenuItems(route.children!, fullPath)
          : undefined;

        return {
          key: fullPath,
          icon: route.meta?.icon,
          label: route.meta?.title,
          children: children?.length ? children : undefined,
        };
      })
      .filter((item) => item); // 过滤掉空项
  };

  // 处理菜单点击
  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    navigate(key);
  };

  // 处理子菜单展开/收起
  const handleOpenChange: MenuProps["onOpenChange"] = (keys) => {
    setOpenKeys(keys);
  };

  // 根据当前路径更新选中的菜单项
  useEffect(() => {
    const pathSnippets = location.pathname.split("/").filter((i) => i);
    const selectedKey = `/${pathSnippets.join("/")}`;
    setSelectedKeys([selectedKey]);

    // 设置展开的子菜单
    const newOpenKeys = pathSnippets.map(
      (_, index) => `/${pathSnippets.slice(0, index + 1).join("/")}`
    );
    setOpenKeys((prevKeys) => {
      const mergedKeys = [...new Set([...prevKeys, ...newOpenKeys])];
      return mergedKeys;
    });
  }, [location.pathname]);

  // 获取根路由下的子路由作为菜单项
  const menuItems = getMenuItems(routes[1].children || []);

  return (
    <Menu
      mode="inline"
      theme="dark"
      items={menuItems}
      onClick={handleMenuClick}
      selectedKeys={selectedKeys}
      openKeys={openKeys}
      onOpenChange={handleOpenChange}
    />
  );
};

export default SideMenu;
