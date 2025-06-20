export const casperIntentExamples = [
  {
    "intent": "Only show this section if the member is over 65.",
    "nodeType": "IfNode",
    "logic": {
      "condition": "member.age > 65",
      "targetBlockId": "AgeBlock"
    }
  },
  {
    "intent": "Show the default disclaimer if no other rules matched.",
    "nodeType": "ElseNode",
    "logic": {
      "targetBlockId": "DefaultDisclaimer"
    }
  },
  {
    "intent": "Use a switch to determine the message based on plan type.",
    "nodeType": "SwitchCaseNode",
    "logic": {
      "switch": "member.planType",
      "cases": {
        "HMO": "ReferralBlock",
        "PPO": "NoReferralBlock"
      }
    }
  },
  {
    "intent": "If the member is over 65 and has diabetes, insert the chronic care notice.",
    "nodeType": "ExpressionNode",
    "logic": {
      "expression": "member.age > 65 && member.conditions.includes('diabetes')",
      "targetBlockId": "ChronicCare"
    }
  },
  {
    "intent": "Repeat this block for every line in the claim.",
    "nodeType": "LoopNode",
    "logic": {
      "path": "claim.lines",
      "targetBlockId": "LineDetails"
    }
  },
  {
    "intent": "Loop through claim lines and show a table of charges.",
    "nodeType": "TableLoopNode",
    "logic": {
      "path": "claim.lines",
      "columns": ["service", "cost"],
      "targetBlockId": "ClaimTable"
    }
  },
  {
    "intent": "Insert the COVID disclaimer block.",
    "nodeType": "BlockNode",
    "logic": {
      "blockId": "COVIDDisclaimer"
    }
  },
  {
    "intent": "Include the Welcome block for new members.",
    "nodeType": "IncludeNode",
    "logic": {
      "reusableBlockId": "WelcomeBlock"
    }
  },
  {
    "intent": "Use the Diabetes Education component.",
    "nodeType": "ComponentInsertNode",
    "logic": {
      "componentId": "DiabetesEducation"
    }
  },
  {
    "intent": "Use dynamic text to greet the member by name.",
    "nodeType": "DynamicTextNode",
    "logic": {
      "text": "Dear {{member.firstName}}, welcome to our plan."
    }
  },
  {
    "intent": "Bold the service denial explanation.",
    "nodeType": "FormattingNode",
    "logic": {
      "style": "bold",
      "targetBlockId": "DenialReason"
    }
  },
  {
    "intent": "If urgent, apply red alert style to the header.",
    "nodeType": "AlertStyleNode",
    "logic": {
      "level": "critical",
      "targetBlockId": "Header"
    }
  },
  {
    "intent": "If writing in Arabic, enable RTL formatting.",
    "nodeType": "LocaleStyleNode",
    "logic": {
      "direction": "rtl"
    }
  },
  {
    "intent": "Hide the balance details section.",
    "nodeType": "HideNode",
    "logic": {
      "targetBlockId": "BalanceDetails"
    }
  },
  {
    "intent": "Insert Medicare nondiscrimination notice.",
    "nodeType": "CMSDisclosureNode",
    "logic": {
      "jurisdiction": "federal",
      "type": "nondiscrimination"
    }
  },
  {
    "intent": "Only include this paragraph if the letter is being printed.",
    "nodeType": "ChannelNode",
    "logic": {
      "channel": "print",
      "targetBlockId": "PrintOnlyNotice"
    }
  },
  {
    "intent": "Switch to Spanish content for Spanish-speaking members.",
    "nodeType": "SetLanguageNode",
    "logic": {
      "language": "es"
    }
  },
  {
    "intent": "Use the provider variation of this letter.",
    "nodeType": "SetVariationNode",
    "logic": {
      "variation": "provider"
    }
  },
  {
    "intent": "Query latest eligibility data from external system.",
    "nodeType": "QueryNode",
    "logic": {
      "source": "eligibilityAPI",
      "query": "member.id"
    }
  },
  {
    "intent": "Sum the total of all claim line costs.",
    "nodeType": "SumNode",
    "logic": {
      "sourcePath": "claim.lines[].cost",
      "resultVariable": "totalCost"
    }
  },
  {
    "intent": "Create a derived variable called isHighRisk.",
    "nodeType": "DerivedVariableNode",
    "logic": {
      "expression": "riskScore > 2",
      "variable": "isHighRisk"
    }
  },
  {
    "intent": "Set a variable indicating the member is in outreach.",
    "nodeType": "SetVariableNode",
    "logic": {
      "name": "isOutreachEligible",
      "value": true
    }
  },
  {
    "intent": "Delete the temporary tracking variable.",
    "nodeType": "DeleteVariableNode",
    "logic": {
      "name": "tempCode"
    }
  },
  {
    "intent": "Call an API to log that the letter was generated.",
    "nodeType": "APICallNode",
    "logic": {
      "endpoint": "https://api.logservice.com/letter",
      "method": "POST"
    }
  },
  {
    "intent": "Insert denial text if reason is not medically necessary.",
    "nodeType": "DenialReasonNode",
    "logic": {
      "reason": "not medically necessary",
      "targetBlockId": "MedicalNecessity"
    }
  },
  {
    "intent": "If the member has a depression diagnosis, include resources.",
    "nodeType": "DiagnosisCodeNode",
    "logic": {
      "codes": ["F32.1", "F33.0"],
      "targetBlockId": "MentalHealthSupport"
    }
  },
  {
    "intent": "If the member's auth type is inpatient, insert special instructions.",
    "nodeType": "AuthTypeNode",
    "logic": {
      "type": "inpatient",
      "targetBlockId": "InpatientInstructions"
    }
  },
  {
    "intent": "Insert HEDIS reminder if breast cancer screening is overdue.",
    "nodeType": "HEDISTriggerNode",
    "logic": {
      "measure": "BCS",
      "targetBlockId": "ScreeningReminder"
    }
  },
  {
    "intent": "If member is assigned a PCP, show PCP name block.",
    "nodeType": "PCPAssignmentNode",
    "logic": {
      "condition": "member.pcpAssigned == true",
      "targetBlockId": "PCPInfo"
    }
  },
  {
    "intent": "Begin the logic flow here.",
    "nodeType": "StartNode",
    "logic": {
      "note": "Start of logic"
    }
  },
  {
    "intent": "Terminate logic branch.",
    "nodeType": "ReturnNode",
    "logic": {
      "note": "No further evaluation"
    }
  },
  {
    "intent": "Flag this node for compliance review.",
    "nodeType": "FlagNode",
    "logic": {
      "targetBlockId": "AppealInstructions"
    }
  }
];
