'use client';

import React, { useState, useEffect } from 'react';
import { 
  ChevronDown, 
  ChevronRight, 
  Play, 
  CheckCircle, 
  XCircle,
  Clock,
  FileText,
  Server,
  Shield,
  ArrowRight,
  Copy
} from 'lucide-react';

interface StatusBadgeProps {
  code: string;
  description: string;
}

interface MethodBadgeProps {
  method: string;
}

interface CodeBlockProps {
  children: string;
  language?: string;
}

interface FlowStepProps {
  icon: React.ComponentType<{ className?: string }>;  title: string;
  description: string;
  isLast?: boolean;
}

interface Response {
  code: string;
  description: string;
}

interface Endpoint {
  method: string;
  path: string;
  summary: string;
  description: string;
  responses: Response[];
  sampleRequest?: string | null;
}

interface EndpointSectionProps {
  endpoint: Endpoint;
}

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;}

const StatusBadge: React.FC<StatusBadgeProps> = ({ code, description }) => {
  const getStatusColor = (code: string) => {
    if (code.startsWith('2')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (code.startsWith('4')) return 'bg-red-100 text-red-800 border-red-200';
    if (code.startsWith('5')) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getStatusColor(code)}`}>
      {code} {description}
    </span>
  );
};

const MethodBadge: React.FC<MethodBadgeProps> = ({ method }) => {
  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'POST': return 'bg-green-100 text-green-800 border-green-200';
      case 'PUT': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold border ${getMethodColor(method)}`}>
      {method.toUpperCase()}
    </span>
  );
};

const CodeBlock: React.FC<CodeBlockProps> = ({ children, language = 'json' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 overflow-x-auto text-sm font-mono">
        <code>{children}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
      >
        {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
};

const FlowStep: React.FC<FlowStepProps> = ({ icon: Icon, title, description, isLast = false }) => (
  <div className="flex items-start">
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-10 h-10 bg-emerald-100 rounded-full">
        <Icon className="w-5 h-5 text-emerald-600" />
      </div>
      {!isLast && <div className="w-px h-8 bg-slate-200 mt-2" />}
    </div>
    <div className="ml-4 pb-8">
      <h4 className="font-medium text-slate-900">{title}</h4>
      <p className="text-sm text-slate-600 mt-1">{description}</p>
    </div>
  </div>
);

const EndpointSection: React.FC<EndpointSectionProps> = ({ endpoint }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [authToken, setAuthToken] = useState('');
  const [requestBody, setRequestBody] = useState(endpoint.sampleRequest || '');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const tryEndpoint = async () => {
    setIsLoading(true);
    setResponse('');
    
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const url = baseUrl + endpoint.path.replace('{id}', 'test-id');
      
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      };

      if (endpoint.method === 'POST' && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const data = await res.text();
      
      setResponse(`HTTP ${res.status} ${res.statusText}\n\n${data}`);
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 bg-white hover:bg-slate-50 transition-colors text-left flex items-center justify-between"
      >
        <div className="flex items-center space-x-3">
          <MethodBadge method={endpoint.method} />
          <code className="font-mono text-sm font-medium text-slate-700">{endpoint.path}</code>
          <span className="text-slate-600">{endpoint.summary}</span>
        </div>
        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </button>
      
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50">
          <div className="p-6 space-y-6">
            <p className="text-slate-700">{endpoint.description}</p>
            
            {/* Response Codes */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Response Codes</h4>
              <div className="flex flex-wrap gap-2">
                {endpoint.responses.map((response: Response, index: number) => (
                  <StatusBadge key={index} code={response.code} description={response.description} />
                ))}
              </div>
            </div>

            {/* Try It Out */}
            <div className="border border-slate-200 rounded-lg bg-white">
              <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
                <h4 className="font-medium text-slate-900">Try it out</h4>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Authorization Token
                  </label>
                  <input
                    type="password"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    placeholder="Bearer token"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>

                {endpoint.method === 'POST' && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Request Body
                    </label>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      rows={6}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500 font-mono text-sm"
                    />
                  </div>
                )}

                <button
                  onClick={tryEndpoint}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-md transition-colors"
                >
                  {isLoading ? (
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? 'Sending...' : 'Send Request'}
                </button>

                {response && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Response
                    </label>
                    <CodeBlock>{response}</CodeBlock>
                  </div>
                )}
              </div>
            </div>

            {/* Sample Code */}
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Sample Request</h4>
              <CodeBlock language="bash">
{`curl -X ${endpoint.method.toUpperCase()} \\
  "${process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.ghostwriter.health'}${endpoint.path}" \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json"${endpoint.method === 'POST' ? ` \\
  -d '${endpoint.sampleRequest || '{}'}'` : ''}`}
              </CodeBlock>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function ModernApiDocs() {
  const [activeSection, setActiveSection] = useState('overview');

  const endpoints: Endpoint[] = [
    {
      method: 'POST',
      path: '/fhir/Task',
      summary: 'Create letter generation task',
      description: 'Submit a new task to generate a clinical letter using FHIR Task resource. This endpoint accepts patient data, template information, and generates a letter asynchronously.',
      responses: [
        { code: '201', description: 'Task created successfully' },
        { code: '400', description: 'Invalid request data' },
        { code: '401', description: 'Unauthorized' },
        { code: '422', description: 'Validation error' }
      ],
      sampleRequest: `{
  "resourceType": "Task",
  "status": "requested",
  "intent": "order",
  "description": "Generate denial letter for MRI authorization",
  "for": {
    "reference": "Patient/12345"
  },
  "input": [
    {
      "type": {
        "text": "template_id"
      },
      "valueString": "denial-template-v1"
    },
    {
      "type": {
        "text": "patient_data"
      },
      "valueString": "{\\"patient_id\\": \\"12345\\", \\"procedure\\": \\"MRI\\", \\"denial_reason\\": \\"Not medically necessary\\"}"
    }
  ]
}`
    },
    {
      method: 'GET',
      path: '/fhir/DocumentReference/{id}',
      summary: 'Retrieve generated letter',
      description: 'Fetch the generated letter PDF and metadata using the DocumentReference ID returned from the Task completion.',
      responses: [
        { code: '200', description: 'Document found' },
        { code: '404', description: 'Document not found' },
        { code: '401', description: 'Unauthorized' }
      ],
      sampleRequest: null
    },
    {
      method: 'GET',
      path: '/fhir/Communication',
      summary: 'Query communications',
      description: 'Search for communications by patient, date range, or other criteria. Supports FHIR search parameters.',
      responses: [
        { code: '200', description: 'Search results returned' },
        { code: '400', description: 'Invalid search parameters' },
        { code: '401', description: 'Unauthorized' }
      ],
      sampleRequest: null
    }
  ];

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Ghostwriter API</h1>
                <p className="text-sm text-slate-600">Healthcare document automation platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <span>v1.0.0</span>
              <span>•</span>
              <span>FHIR R4</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <nav className="space-y-1">
              {([
                { id: 'overview', label: 'Overview', icon: FileText },
                { id: 'authentication', label: 'Authentication', icon: Shield },
                { id: 'workflow', label: 'Workflow', icon: ArrowRight },
                { id: 'endpoints', label: 'Endpoints', icon: Server }
              ] as NavigationItem[]).map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollToSection(item.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                    activeSection === item.id
                      ? 'bg-emerald-100 text-emerald-700 font-medium'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <item.icon className="w-4 h-4 mr-3" />
                  {item.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="space-y-12">
            {/* Overview */}
            <section id="overview">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">API Overview</h2>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    The Ghostwriter API enables healthcare organizations to generate, store, and track clinical letters and communications using FHIR R4 standards. Our platform combines intelligent template processing with regulatory compliance automation.
                  </p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="ml-3">
                      <h3 className="font-medium text-emerald-900">Key Features</h3>
                      <ul className="mt-2 text-sm text-emerald-800 space-y-1">
                        <li>• FHIR R4 compliant API endpoints</li>
                        <li>• Automated letter generation with smart templates</li>
                        <li>• Multi-channel delivery (mail, fax, digital)</li>
                        <li>• Full audit trail and compliance tracking</li>
                        <li>• Real-time status updates and notifications</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="font-semibold text-slate-900 mb-2">Base URL</h3>
                    <CodeBlock>https://api.ghostwriter.health</CodeBlock>
                  </div>
                  <div className="bg-white border border-slate-200 rounded-lg p-6">
                    <h3 className="font-semibold text-slate-900 mb-2">Content Type</h3>
                    <CodeBlock>application/fhir+json</CodeBlock>
                  </div>
                </div>
              </div>
            </section>

            {/* Authentication */}
            <section id="authentication">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">Authentication</h2>
                  <p className="text-slate-600">
                    All API requests require authentication using Bearer tokens. Include your token in the Authorization header of every request.
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="font-medium text-slate-900 mb-3">Request Headers</h3>
                  <CodeBlock>{`Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/fhir+json
Accept: application/fhir+json`}</CodeBlock>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <Shield className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm text-amber-800">
                        <strong>Security Note:</strong> Keep your API tokens secure and never expose them in client-side code. Tokens should be stored securely and rotated regularly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Workflow */}
            <section id="workflow">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">API Workflow</h2>
                  <p className="text-slate-600">
                    The typical workflow for generating and retrieving clinical letters involves these steps:
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <FlowStep
                    icon={Server}
                    title="1. Submit Generation Task"
                    description="POST a FHIR Task resource with patient data, template ID, and letter requirements"
                  />
                  <FlowStep
                    icon={Clock}
                    title="2. Processing & Generation"
                    description="Ghostwriter processes the request, applies business rules, and generates the formatted letter"
                  />
                  <FlowStep
                    icon={FileText}
                    title="3. Document Storage"
                    description="Generated PDF and metadata are stored securely with unique DocumentReference ID"
                  />
                  <FlowStep
                    icon={CheckCircle}
                    title="4. Retrieve Results"
                    description="GET the DocumentReference to download the final letter and delivery status"
                    isLast={true}
                  />
                </div>
              </div>
            </section>

            {/* Endpoints */}
            <section id="endpoints">
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-3">API Endpoints</h2>
                  <p className="text-slate-600">
                    Explore and test our FHIR-compliant endpoints. Each endpoint includes interactive testing capabilities.
                  </p>
                </div>

                <div className="space-y-4">
                  {endpoints.map((endpoint: Endpoint, index: number) => (
                    <EndpointSection key={index} endpoint={endpoint} />
                  ))}
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}