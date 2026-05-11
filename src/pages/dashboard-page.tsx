import { Card, Col, Row, Typography } from 'antd';

export function DashboardPage() {
  return (
    <Row gutter={[16, 16]}>
      <Col span={24}>
        <Typography.Title level={2}>Vayura AI</Typography.Title>
        <Typography.Paragraph>
          Frontend foundation is ready. Next step is mapping the UI design screens into reusable components.
        </Typography.Paragraph>
      </Col>
      <Col xs={24} md={12}>
        <Card title="Ingestion pipeline">Support planned for PDF, Excel, and image parsing.</Card>
      </Col>
      <Col xs={24} md={12}>
        <Card title="Product workflow">We will build incrementally from our internal product docs and API contracts.</Card>
      </Col>
    </Row>
  );
}
