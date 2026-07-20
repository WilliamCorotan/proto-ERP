import { Bot, CheckCircle2, RadioTower, ShieldAlert } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  DataCard,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldText,
  Input,
  MetricTile,
  NativeSelect,
  PageHeader,
  RecordPanel,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Timeline,
  TimelineRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "../../components/design-system";

const swatches = [
  ["Command blue", "var(--ds-color-blue)"],
  ["Operations green", "var(--ds-color-green)"],
  ["Risk amber", "var(--ds-color-amber)"],
  ["Control red", "var(--ds-color-red)"],
  ["Automation violet", "var(--ds-color-violet)"],
  ["Shell", "var(--ds-color-shell)"]
];

export default function DesignSystemPage() {
  return (
    <div className="page-stack">
      <PageHeader
        actions={
          <Badge tone="automation">
            <Bot size={14} aria-hidden="true" /> Enterprise DS
          </Badge>
        }
        eyebrow="Design system"
        title="Command Center"
      >
        Token-first ERP interface language for dense operational workflows, automation states, finance controls, and
        cross-module command surfaces.
      </PageHeader>

      <section className="metric-grid" aria-label="Design system metrics">
        <MetricTile icon={<RadioTower size={20} aria-hidden="true" />} label="Tokens" tone="info" trend="semantic foundation" value="72+" />
        <MetricTile icon={<CheckCircle2 size={20} aria-hidden="true" />} label="Primitives" tone="success" trend="Radix backed" value="14" />
        <MetricTile icon={<ShieldAlert size={20} aria-hidden="true" />} label="States" tone="warning" trend="status and risk" value="7" />
        <MetricTile icon={<Bot size={20} aria-hidden="true" />} label="Automation" tone="automation" trend="AI/action ready" value="On" />
      </section>

      <Tabs defaultValue="tokens">
        <TabsList aria-label="Design system catalog">
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
          <TabsTrigger value="controls">Controls</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="tokens">
          <RecordPanel eyebrow="Foundation" title="Color and status tokens">
            <div className="data-grid">
              {swatches.map(([label, value]) => (
                <DataCard key={label} eyebrow={label} title={value}>
                  <span className="ds-swatch" style={{ background: value }} />
                </DataCard>
              ))}
            </div>
          </RecordPanel>
        </TabsContent>

        <TabsContent value="controls">
          <section className="split-grid">
            <Card>
              <CardHeader>
                <div>
                  <p className="ds-eyebrow">Actions</p>
                  <CardTitle>Buttons and badges</CardTitle>
                  <CardDescription>Shared action hierarchy and operational state language.</CardDescription>
                </div>
              </CardHeader>
              <div className="ds-demo-row">
                <Button>Post journal</Button>
                <Button variant="secondary">Save draft</Button>
                <Button variant="ghost">Inspect</Button>
                <Button variant="danger">Void</Button>
              </div>
              <div className="ds-demo-row">
                <Badge tone="success">Posted</Badge>
                <Badge tone="warning">Variance</Badge>
                <Badge tone="danger">Failed</Badge>
                <Badge tone="automation">Automated</Badge>
              </div>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <p className="ds-eyebrow">Inputs</p>
                  <CardTitle>Forms and Radix controls</CardTitle>
                  <CardDescription>Accessible primitives with the ERP token layer.</CardDescription>
                </div>
              </CardHeader>
              <div className="record-form">
                <Field>
                  <FieldText>Reference</FieldText>
                  <Input defaultValue="JE-2026-0091" />
                </Field>
                <Field>
                  <FieldText>Native select</FieldText>
                  <NativeSelect defaultValue="posted">
                    <option value="draft">Draft</option>
                    <option value="posted">Posted</option>
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldText>Radix select</FieldText>
                  <Select defaultValue="finance">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="inventory">Inventory</SelectItem>
                      <SelectItem value="automation">Automation</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldText>Switch</FieldText>
                  <Switch defaultChecked aria-label="Enable workflow rule" />
                </Field>
                <Field>
                  <FieldText>Checkbox</FieldText>
                  <Checkbox defaultChecked aria-label="Require approval" />
                </Field>
              </div>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="patterns">
          <section className="split-grid">
            <RecordPanel eyebrow="Workflow" title="Action timeline" badge={<Badge tone="processing">Live</Badge>}>
              <Timeline>
                <TimelineRow label="Submitted">Purchase order is waiting for approval.</TimelineRow>
                <TimelineRow label="Approved">Procurement released the order to receiving.</TimelineRow>
                <TimelineRow label="Automated">Outbox dispatcher notified the subscribed endpoint.</TimelineRow>
              </Timeline>
            </RecordPanel>
            <Card>
              <CardHeader>
                <div>
                  <p className="ds-eyebrow">Overlays</p>
                  <CardTitle>Tooltip and dialog</CardTitle>
                  <CardDescription>Radix behaviors styled by the same command tokens.</CardDescription>
                </div>
              </CardHeader>
              <div className="ds-demo-row">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="secondary">Inspect signal</Button>
                    </TooltipTrigger>
                    <TooltipContent>Shows operational context without leaving the workflow.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Open control brief</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>Command Center brief</DialogTitle>
                    <DialogDescription>
                      Use these primitives for ERP workflows that need dense information, clear status, and reliable
                      keyboard access.
                    </DialogDescription>
                  </DialogContent>
                </Dialog>
              </div>
            </Card>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
