import {
  GitBranch,
  SwitchCamera,
  Sigma,
  Repeat2,
  Table2,
  ClipboardList,
  FileText,
  Text,
  Bold,
  AlertTriangle,
  Globe,
  EyeOff,
  ShieldCheck,
  ShieldAlert,
  Languages,
  Globe2,
  Mail,
  Printer,
  Undo2,
  SplitSquareHorizontal,
  Calculator,
  Database,
  Cloud,
  Share2,
  CheckCircle2,
  UserCheck,
  Stethoscope,
  Activity,
  HeartPulse,
  UserSquare,
  Layers,
  Flag,
  PackagePlus,
  Link
} from 'lucide-react';

export interface NodeTypeDef {
  label: string;
  icon: React.ElementType;
  color: string;
  group: string;
  description?: string;
  prompt?: string;
}

const nodeTypes: Record<string, NodeTypeDef> = {
  IfNode: {
    label: 'If',
    icon: GitBranch,
    color: 'badge-indigo',
    group: 'Logic',
    description: 'Show this block if a condition is met.',
    prompt: 'Only show this block if the member is over 65.'
  },
  ElseNode: {
    label: 'Else',
    icon: GitBranch,
    color: 'badge-gray',
    group: 'Logic',
    description: 'Fallback when no conditions are met.',
    prompt: 'Insert default content when no conditions are met.'
  },
  SwitchCaseNode: {
    label: 'Switch',
    icon: SwitchCamera,
    color: 'badge-purple',
    group: 'Logic',
    description: 'Multi-case branching logic',
    prompt: 'Switch on planType and show different blocks.'
  },
  ExpressionNode: {
    label: 'Expression',
    icon: Sigma,
    color: 'badge-pink',
    group: 'Logic',
    description: 'AND/OR chaining',
    prompt: 'Show content if the member has diabetes and is over 45.'
  },
  LoopNode: {
    label: 'Loop',
    icon: Repeat2,
    color: 'badge-blue',
    group: 'Looping',
    description: 'Repeat content for each array item',
    prompt: 'Repeat this block for each line in the claim.'
  },
  TableLoopNode: {
    label: 'Table Loop',
    icon: Table2,
    color: 'badge-cyan',
    group: 'Looping',
    description: 'Render a dynamic table of rows',
    prompt: 'Render a table row for each diagnosis code.'
  },
  BlockNode: {
    label: 'Block',
    icon: FileText,
    color: 'badge-violet',
    group: 'Content',
    description: 'A named content section',
    prompt: 'Insert a reusable paragraph for coverage terms.'
  },
  IncludeNode: {
    label: 'Include Block',
    icon: Layers,
    color: 'badge-indigo-subtle',
    group: 'Content',
    description: 'Reference another block by ID',
    prompt: 'Include the COVID notice block.'
  },
  ComponentInsertNode: {
    label: 'Component',
    icon: PackagePlus,
    color: 'badge-fuchsia',
    group: 'Content',
    description: 'Insert a reusable component',
    prompt: 'Insert the diabetes education component.'
  },
  DynamicTextNode: {
    label: 'Dynamic Text',
    icon: Text,
    color: 'badge-blue-subtle',
    group: 'Content',
    description: 'Text with inserted variables',
    prompt: 'Insert "Dear {{member.firstName}}" into the letter.'
  },
  FormattingNode: {
    label: 'Formatting',
    icon: Bold,
    color: 'badge-yellow',
    group: 'Styling',
    description: 'Bold, italic, highlight rules',
    prompt: 'Bold the denial reason section.'
  },
  AlertStyleNode: {
    label: 'Alert Style',
    icon: AlertTriangle,
    color: 'badge-rose',
    group: 'Styling',
    description: 'Urgent red banner or emphasis',
    prompt: 'Highlight this paragraph in red.'
  },
  HideNode: {
    label: 'Hide',
    icon: EyeOff,
    color: 'badge-gray-subtle',
    group: 'Styling',
    description: 'Hide/show logic',
    prompt: 'Hide this block unless it’s a denial.'
  },
  LocaleStyleNode: {
    label: 'Locale Format',
    icon: Globe,
    color: 'badge-yellow-subtle',
    group: 'Styling',
    description: 'Format for RTL or currency/date',
    prompt: 'Format for RTL if the language is Arabic.'
  },
  CMSDisclosureNode: {
    label: 'CMS Notice',
    icon: ShieldCheck,
    color: 'badge-red',
    group: 'Compliance',
    description: 'Insert CMS-mandated text',
    prompt: 'Insert the nondiscrimination notice.'
  },
  HIPAANoticeNode: {
    label: 'HIPAA Notice',
    icon: ShieldAlert,
    color: 'badge-red-subtle',
    group: 'Compliance',
    description: 'Insert HIPAA policy block',
    prompt: 'Insert the HIPAA privacy policy.'
  },
  LanguageAccessNode: {
    label: 'Language Access',
    icon: Languages,
    color: 'badge-orange',
    group: 'Compliance',
    description: 'Multi-language footer block',
    prompt: 'Insert the language access footer.'
  },
  ChannelNode: {
    label: 'Channel Check',
    icon: Printer,
    color: 'badge-green',
    group: 'Delivery',
    description: 'Condition on email/print/fax',
    prompt: 'Only show this if delivered via fax.'
  },
  ChannelFallbackNode: {
    label: 'Channel Fallback',
    icon: Undo2,
    color: 'badge-fuchsia',
    group: 'Delivery',
    description: 'Fallback delivery format',
    prompt: 'Fallback to print if email fails.'
  },
  SetLanguageNode: {
    label: 'Set Language',
    icon: Globe2,
    color: 'badge-orange-subtle',
    group: 'Language',
    description: 'Force the letter’s language',
    prompt: 'Switch this content to Spanish.'
  },
  SetVariationNode: {
    label: 'Variation',
    icon: SplitSquareHorizontal,
    color: 'badge-purple-muted',
    group: 'Language',
    description: 'Switch template version (e.g. provider)',
    prompt: 'Use the provider version of this letter.'
  },
  SetVariableNode: {
    label: 'Set Variable',
    icon: Flag,
    color: 'badge-blue',
    group: 'Variables',
    description: 'Set a runtime flag or logic var',
    prompt: 'Set isHighRisk to true if score > 2.0.'
  },
  DerivedVariableNode: {
    label: 'Derived Variable',
    icon: Calculator,
    color: 'badge-indigo',
    group: 'Variables',
    description: 'Create a calculated variable',
    prompt: 'Create a variable based on (A * B / 100).'
  },
  QueryNode: {
    label: 'Query',
    icon: Database,
    color: 'badge-cyan',
    group: 'Data',
    description: 'Lookup from API or context',
    prompt: 'Query member eligibility from API.'
  },
  APICallNode: {
    label: 'API Call',
    icon: Cloud,
    color: 'badge-sky',
    group: 'Workflow',
    description: 'Trigger external API',
    prompt: 'Send audit trail API call when logic is triggered.'
  },
  PushDataNode: {
    label: 'Push Data',
    icon: Share2,
    color: 'badge-sky-subtle',
    group: 'Workflow',
    description: 'Send logic result downstream',
    prompt: 'Send this logic result to Salesforce.'
  },
  DiagnosisCodeNode: {
    label: 'Diagnosis Match',
    icon: HeartPulse,
    color: 'badge-indigo-muted',
    group: 'Healthcare',
    description: 'Condition on ICD-10 code',
    prompt: 'If the member has depression, show a support link.'
  },
  RiskScoreNode: {
    label: 'Risk Score',
    icon: Activity,
    color: 'badge-red-subtle',
    group: 'Healthcare',
    description: 'Condition on risk score value',
    prompt: 'If risk score > 3, show intervention program.'
  },
  HEDISTriggerNode: {
    label: 'HEDIS Trigger',
    icon: CheckCircle2,
    color: 'badge-pink',
    group: 'Healthcare',
    description: 'HEDIS gap or measure logic',
    prompt: 'If BCS is overdue, send a screening reminder.'
  },
  PCPAssignmentNode: {
    label: 'PCP Assigned',
    icon: UserSquare,
    color: 'badge-blue-subtle',
    group: 'Healthcare',
    description: 'Show based on PCP availability',
    prompt: 'Show name of assigned PCP if it exists.'
  },
  ProgramEligibilityNode: {
    label: 'Program Eligibility',
    icon: UserCheck,
    color: 'badge-blue-muted',
    group: 'Healthcare',
    description: 'Show if eligible for a program',
    prompt: 'Insert block if eligible for diabetes coaching.'
  },
  FHIRQueryNode: {
    label: 'FHIR Lookup',
    icon: Stethoscope,
    color: 'badge-cyan-subtle',
    group: 'Data',
    description: 'Look up FHIR resource (e.g. Condition)',
    prompt: 'Get latest condition for diabetes using FHIR.'
  },
  DataJoinNode: {
    label: 'Data Join',
    icon: Link,
    color: 'badge-cyan-muted',
    group: 'Data',
    description: 'Join two or more data sources',
    prompt: 'Join external risk data with internal member profile.'
  },
  ReturnNode: {
    label: 'Return',
    icon: Flag,
    color: 'badge-zinc',
    group: 'Logic',
    description: 'End the logic branch early',
    prompt: 'Stop logic if condition fails.'
  },
  FlagNode: {
    label: 'Flag',
    icon: Flag,
    color: 'badge-stone',
    group: 'Meta',
    description: 'Mark for review or debugging',
    prompt: 'Flag this rule for legal review.'
  }
};

export default nodeTypes;
