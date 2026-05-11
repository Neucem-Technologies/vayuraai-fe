import { Layout, theme } from 'antd';
import { AppRoutes } from './routes/app-routes';

const { Header, Content } = Layout;

function App() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ color: 'white', fontWeight: 600, letterSpacing: 0.5 }}>Vayura AI Platform</Header>
      <Content style={{ padding: 24, background: colorBgContainer }}>
        <AppRoutes />
      </Content>
    </Layout>
  );
}

export default App;
