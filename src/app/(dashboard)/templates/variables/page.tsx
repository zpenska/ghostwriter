
'use client'

import { useState, useEffect } from 'react'
import { Breadcrumb } from '@/components/ui/breadcrumb'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Toggle } from '@/components/ui/toggle'
import { db } from '@/lib/firebase.config'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'

interface Variable {
  name: string
  label: string
  type: string
  format: {
    locale: string
    pattern: string
    nonBreakingSpace: boolean
  }
}

export default function VariableFormatEditor() {
  const [variables, setVariables] = useState<Variable[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchVariables = async () => {
      const snapshot = await getDocs(collection(db, 'variables'))
      const vars: Variable[] = []
      snapshot.forEach(docSnap => {
        const data = docSnap.data()
        vars.push({
          name: docSnap.id,
          label: data.label || docSnap.id,
          type: data.type || 'xs:string',
          format: data.format || { locale: 'en-US', pattern: 'text', nonBreakingSpace: false }
        })
      })
      setVariables(vars)
      setLoading(false)
    }
    fetchVariables()
  }, [])

  const handleFormatChange = async (varName: string, key: keyof Variable['format'], value: any) => {
    const updated = variables.map(v =>
      v.name === varName ? { ...v, format: { ...v.format, [key]: value } } : v
    )
    setVariables(updated)
    // This would sync to Firestore later once backend is wired
  }

  return (
    <div className="p-6 space-y-6">
      <Breadcrumb
        items={[
          { name: 'Templates', href: '/templates' },
          { name: 'Variable Formatting', href: '/templates/variables' }
        ]}
      />

      <h1 className="text-2xl font-bold">Variable Formatting Settings</h1>

      {loading ? (
        <div className="text-gray-500">Loading variables...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {variables.map(variable => (
            <Card key={variable.name}>
              <CardHeader>
                <CardTitle>{variable.label}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Data Type</Label>
                  <div className="text-sm text-gray-500">{variable.type}</div>
                </div>

                <div>
                  <Label>Format Type</Label>
                  <Select
                    value={variable.format.pattern}
                    onValueChange={(val) => handleFormatChange(variable.name, 'pattern', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="YMD">Date (YMD)</SelectItem>
                      <SelectItem value="DMY">Date (DMY)</SelectItem>
                      <SelectItem value="MDY">Date (MDY)</SelectItem>
                      <SelectItem value="currency">Currency ($1,000.00)</SelectItem>
                      <SelectItem value="percentage">Percentage (95%)</SelectItem>
                      <SelectItem value="custom">Custom Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Locale</Label>
                  <Select
                    value={variable.format.locale}
                    onValueChange={(val) => handleFormatChange(variable.name, 'locale', val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Locale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-US">English - United States</SelectItem>
                      <SelectItem value="en-GB">English - United Kingdom</SelectItem>
                      <SelectItem value="fr-FR">French - France</SelectItem>
                      <SelectItem value="es-ES">Spanish - Spain</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Formatting Options</Label>
                  <div className="flex items-center gap-3">
                    <Toggle
                      pressed={variable.format.nonBreakingSpace}
                      onPressedChange={(val) => handleFormatChange(variable.name, 'nonBreakingSpace', val)}
                    >
                      Use non-breaking space
                    </Toggle>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
