"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  CreditCard,
  Bell,
  Brain,
  Shield,
  Globe,
  Save,
} from "lucide-react";

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SectionSave() {
  return (
    <div className="flex justify-end pt-2">
      <Button size="sm" className="h-8 text-xs gap-2">
        <Save className="h-3.5 w-3.5" /> Save Changes
      </Button>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Platform Configuration</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          System settings, payment config, notifications, and AI matching parameters
        </p>
      </div>

      <Tabs defaultValue="system">
        <TabsList className="h-9 bg-muted/50 flex-wrap">
          <TabsTrigger value="system" className="text-xs gap-1.5">
            <Settings className="h-3 w-3" /> System
          </TabsTrigger>
          <TabsTrigger value="payment" className="text-xs gap-1.5">
            <CreditCard className="h-3 w-3" /> Payment
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs gap-1.5">
            <Bell className="h-3 w-3" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="ai" className="text-xs gap-1.5">
            <Brain className="h-3 w-3" /> AI Matching
          </TabsTrigger>
        </TabsList>

        {/* System Settings */}
        <TabsContent value="system" className="mt-4 space-y-4">
          <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-muted-foreground" /> General
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/40">
              <SettingRow label="Platform Name" description="The name displayed across the platform">
                <Input defaultValue="Abjad" className="h-8 w-48 text-sm bg-muted/50 border-border/50" />
              </SettingRow>
              <SettingRow label="Default Language" description="Primary interface language">
                <Select defaultValue="ar">
                  <SelectTrigger className="h-8 w-36 text-xs bg-muted/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ar">Arabic (العربية)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Timezone" description="Saudi Arabia Standard Time">
                <Select defaultValue="ast">
                  <SelectTrigger className="h-8 w-44 text-xs bg-muted/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ast">AST (UTC+3)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </SettingRow>
              <SettingRow label="Maintenance Mode" description="Temporarily disable public access">
                <Switch />
              </SettingRow>
              <SettingRow label="Registration Open" description="Allow new user registrations">
                <Switch defaultChecked />
              </SettingRow>
              <SettingRow label="Max Profile Image Size" description="Maximum upload size in MB">
                <Input defaultValue="5" type="number" className="h-8 w-24 text-sm bg-muted/50 border-border/50" />
              </SettingRow>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" /> Security
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border/40">
              <SettingRow label="OTP Expiry" description="Time in minutes before OTP expires">
                <Input defaultValue="5" type="number" className="h-8 w-24 text-sm bg-muted/50 border-border/50" />
              </SettingRow>
              <SettingRow label="Max Login Attempts" description="Before account lockout">
                <Input defaultValue="5" type="number" className="h-8 w-24 text-sm bg-muted/50 border-border/50" />
              </SettingRow>
              <SettingRow label="Session Duration" description="Hours until auto-logout">
                <Input defaultValue="24" type="number" className="h-8 w-24 text-sm bg-muted/50 border-border/50" />
              </SettingRow>
              <SettingRow label="Require Background Check" description="Mandatory for teacher approval">
                <Switch defaultChecked />
              </SettingRow>
            </CardContent>
          </Card>
          <SectionSave />
        </TabsContent>

        {/* Payment Settings */}
        <TabsContent value="payment" className="mt-4 space-y-4">
          <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Payment Gateway</CardTitle>
              <CardDescription className="text-xs">Configure Moyasar / Stripe settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Gateway Provider</Label>
                <Select defaultValue="moyasar">
                  <SelectTrigger className="h-8 text-sm bg-muted/50 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="moyasar">Moyasar</SelectItem>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="hyperpay">HyperPay</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">API Key (Publishable)</Label>
                <Input type="password" defaultValue="pk_live_••••••••••••••••" className="h-8 text-sm bg-muted/50 border-border/50 font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Secret Key</Label>
                <Input type="password" defaultValue="sk_live_••••••••••••••••" className="h-8 text-sm bg-muted/50 border-border/50 font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Webhook Secret</Label>
                <Input type="password" defaultValue="whsec_••••••••••••" className="h-8 text-sm bg-muted/50 border-border/50 font-mono" />
              </div>
              <Separator className="opacity-40" />
              <div className="space-y-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subscription Plans (SAR)</p>
                {[
                  { name: "Standard – 1 Month", price: "499" },
                  { name: "Standard – 3 Months", price: "1,200" },
                  { name: "Premium – 1 Month", price: "699" },
                  { name: "Premium – 3 Months", price: "1,800" },
                  { name: "Premium – 1 Year", price: "5,800" },
                ].map((plan) => (
                  <div key={plan.name} className="flex items-center justify-between gap-4">
                    <span className="text-sm">{plan.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-muted-foreground">SAR</span>
                      <Input defaultValue={plan.price} className="h-7 w-24 text-sm bg-muted/50 border-border/50 text-right tabular-nums" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <SectionSave />
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Email Notifications</CardTitle>
              <CardDescription className="text-xs">Configure SMTP and notification triggers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">SMTP Host</Label>
                  <Input defaultValue="smtp.sendgrid.net" className="h-8 text-sm bg-muted/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">SMTP Port</Label>
                  <Input defaultValue="587" className="h-8 text-sm bg-muted/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">From Name</Label>
                  <Input defaultValue="Abjad Platform" className="h-8 text-sm bg-muted/50 border-border/50" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">From Email</Label>
                  <Input defaultValue="noreply@abjad.sa" className="h-8 text-sm bg-muted/50 border-border/50" />
                </div>
              </div>
              <Separator className="opacity-40" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Triggers</p>
              <div className="divide-y divide-border/40">
                {[
                  { label: "Teacher Registration", description: "Welcome email on signup" },
                  { label: "Profile Approved", description: "Notify teacher when approved" },
                  { label: "Application Received", description: "Confirm application to teacher" },
                  { label: "Interview Scheduled", description: "Notify both parties" },
                  { label: "Offer Extended", description: "Notify teacher of job offer" },
                  { label: "Daily Digest", description: "Daily summary for admin" },
                ].map((trigger) => (
                  <SettingRow key={trigger.label} label={trigger.label} description={trigger.description}>
                    <Switch defaultChecked />
                  </SettingRow>
                ))}
              </div>
            </CardContent>
          </Card>
          <SectionSave />
        </TabsContent>

        {/* AI Matching */}
        <TabsContent value="ai" className="mt-4 space-y-4">
          <Card className="bg-white border border-slate-100 rounded-2xl shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold">Match Score Formula</CardTitle>
                  <CardDescription className="text-xs">Weight distribution must total 100%</CardDescription>
                </div>
                <Badge variant="secondary" className="text-xs">Phase 1</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { factor: "Subject Match", weight: 30, description: "Primary teaching subject alignment" },
                { factor: "Grade Level Match", weight: 20, description: "Grade levels taught vs. required" },
                { factor: "Experience Level", weight: 20, description: "Years of teaching experience" },
                { factor: "Location", weight: 15, description: "City and region preference match" },
                { factor: "Language", weight: 10, description: "Arabic / English / bilingual match" },
                { factor: "Qualifications", weight: 5, description: "Degree and certifications" },
              ].map((item) => (
                <div key={item.factor} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.factor}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        defaultValue={item.weight}
                        className="h-7 w-16 text-sm text-right bg-muted/50 border-border/50 tabular-nums"
                      />
                      <span className="text-xs text-muted-foreground w-4">%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${item.weight}%` }}
                    />
                  </div>
                </div>
              ))}
              <Separator className="opacity-40" />
              <SettingRow
                label="Minimum Match Score"
                description="Minimum score to surface a recommendation"
              >
                <div className="flex items-center gap-2">
                  <Input defaultValue="60" type="number" className="h-7 w-20 text-sm bg-muted/50 border-border/50 text-right" />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </SettingRow>
              <SettingRow label="Enable AI Recommendations" description="Surface teacher suggestions to schools">
                <Switch defaultChecked />
              </SettingRow>
              <SettingRow label="Enable Job Recommendations" description="Surface job suggestions to teachers">
                <Switch defaultChecked />
              </SettingRow>
            </CardContent>
          </Card>
          <SectionSave />
        </TabsContent>
      </Tabs>
    </div>
  );
}
