export const yearMarks = [
    {
      value: 1,
      label: "1 Yr",
    },
    {
      value: 11,
      label: "11 Yr",
    },
    {
      value: 20,
      label: "20 Yr",
    },
  ];
  
  export const LPAMarks = [
    {
      value: 1,
      label: "1 LPA",
    },
    {
      value: 11,
      label: "11 LPA",
    },
    {
      value: 20,
      label: "20 LPA",
    },
  ];
  
  export const dayMarks = [
    {
      value: 1,
      label: "1 Days",
    },
    {
      value: 45,
      label: "45 Days",
    },
    {
      value: 90,
      label: "90 Days",
    },
  ];
  
  export const defaultStatus = [
    {
      key: "APPLIED",
      name: "Applied"
    },
    {
      key: "CALL_NA",
      name: "Called NA"
    },
    {
      key: "NOT_INTERESTED",
      name: "Not Interested"
    },
    {
      key: "TBC_LATER",
      name: "TBC Later"
    },
    {
      key: "ROHIT SELECTED",
      name: "Rohit Selected"
    },
    {
      key: "ROHIT REJECTED",
      name: "Rohit Rejected"
    },
    {
      key: "ROHIT SCHEDULED",
      name: "Rohit Scheduled"
    },
  ];
  
  export const defaultSource = [
    {
        key: "careers website",
        name: "careers website",
    },
    {
        key: "relinns chatbot",
        name: "relinns chatbot",
    },
    {
        key: "email",
        name: "email",
    },
    {
        key: "internshala",
        name: "internshala",
    },
    {
        key: "linkedin",
        name: "linkedin",
    },
    {
        key: "naukri",
        name: "naukri",
    },
    {
        key: "manual",
        name: "manual",
    },
    {
        key: "excel file",
        name: "excel file",
    },
    {
        key: "whatsapp-bot",
        name: "whatsapp-bot",
    }
];

export const filterInitialState = Object.freeze({
  selectedMenu: 0,
  experience: {
    isApply: false,
    value: [1, 5]
  },
  ctc: {
    isApply: false,
    value: [1, 5]
  },
  ectc: {
    isApply: false,
    value: [1, 5]
  },
  noticePeriod: {
    isApply: false,
    value: [15, 30]
  },
  status: [],
  assignTo: [],
  jobId: [],
  source: [],
  cpd: [],
  date: []
});