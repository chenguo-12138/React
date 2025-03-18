import { MoneyCollectTwoTone } from "@ant-design/icons";
import { Layout as AndtLayout } from "antd";
import { Outlet } from "react-router-dom";
import { SiderMenu } from "./components";
import { useSafeState } from "ahooks";
const { Header, Content, Sider } = AndtLayout;
const Layout = () => {
  const headerStyle: React.CSSProperties = {
    textAlign: "center",
    color: "#fff",
    height: 64,
    paddingInline: 48,
    lineHeight: "64px",
  };

  const contentStyle: React.CSSProperties = {
    textAlign: "center",
    minHeight: 120,
  };

  const layoutStyle = {
    borderRadius: 8,
    overflow: "hidden",
    height: "100%",
  };

  const [collapsed, setCollapsed] = useSafeState(false);

  return (
    <AndtLayout style={layoutStyle}>
      <Header style={headerStyle}>
        This is for money
        <MoneyCollectTwoTone />
      </Header>
      <AndtLayout>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={(value) => setCollapsed(value)}
        >
          <SiderMenu />
        </Sider>
        <Content style={contentStyle}>
          <Outlet />
        </Content>
      </AndtLayout>
    </AndtLayout>
  );
};

export default Layout;
