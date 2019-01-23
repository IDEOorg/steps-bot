const clients = [
  {
    id: 717,
    first_name: 'Micah',
    last_name: 'Oriaso',
    email: 'mi@gmail.com',
    phone: '+11234567891',
    coach_id: 6,
    org_id: 4,
    internal_id: null,
    color: null,
    goals: [],
    status: 'WORKING',
    type: 'Client',
    created_at: '2019-01-07T12:01:20.705Z',
    updated_at: '2019-01-07T12:01:20.705Z',
    platform: 'FBOOK',
    image: null,
    follow_up_date: null,
    plan_url:
      'http://localhost:3000/plan/U2FsdGVkX18yp6SHt5k%2FUdRKxPJGZVX5B%2Fpl93d8FaY%3D',
    checkin_times: null,
    topic: null,
    fb_id: 5534,
    temp_help_response: null,
    auth0_id: '5c333f907e5da976e1ea4df5',
    favorites: null
  },
  {
    id: 112,
    first_name: 'Geoffrey',
    last_name: 'Williams',
    email: 'gg@gmail.com',
    phone: '2345671823',
    coach_id: 6,
    org_id: 4,
    internal_id: null,
    color: null,
    goals: [],
    status: 'WORKING',
    type: 'Client',
    created_at: '2019-01-07T12:01:59.910Z',
    updated_at: '2019-01-07T12:01:59.910Z',
    platform: null,
    image: null,
    follow_up_date: null,
    plan_url:
      'http://localhost:3000/plan/U2FsdGVkX19kfG6%2Bv4FxYJlhBss9LAyu5S6PPz5CKp4%3D',
    checkin_times: null,
    topic: null,
    fb_id: null,
    temp_help_response: null,
    auth0_id: '5c333fb70d96bc7d190f708a',
    favorites: null
  },
  {
    id: 113,
    first_name: 'Joy',
    last_name: 'Kasavuli',
    email: 'we@gmail.com',
    phone: '7766889922',
    coach_id: 6,
    org_id: 4,
    internal_id: null,
    color: null,
    goals: [],
    status: 'WORKING',
    type: 'Client',
    created_at: '2019-01-07T12:01:59.910Z',
    updated_at: '2019-01-07T12:01:59.910Z',
    platform: null,
    image: null,
    follow_up_date: new Date(),
    plan_url:
      'http://localhost:3000/plan/U2FsdGVkX19kfG6%2Bv4FxYJlhBss9LAyu5S6PPz5CKp4%3D',
    checkin_times: null,
    topic: 'checkin',
    fb_id: null,
    temp_help_response: null,
    auth0_id: '5c333fb70d96bc7d190f708a',
    favorites: null
  },
  {
    id: 718,
    first_name: 'Mary',
    last_name: 'Nicholson',
    email: 'mn@gmail.com',
    phone: '1234567890',
    coach_id: 6,
    org_id: 4,
    internal_id: null,
    color: null,
    goals: [],
    status: 'WORKING',
    type: 'Client',
    created_at: '2019-01-07T12:01:20.705Z',
    updated_at: '2019-01-07T12:01:20.705Z',
    platform: 'FBOOK',
    image: null,
    follow_up_date: null,
    plan_url:
      'http://localhost:3000/plan/U2FsdGVkX18yp6SHt5k%2FUdRKxPJGZVX5B%2Fpl93d8FaY%3D',
    checkin_times: null,
    topic: null,
    fb_id: 5533,
    temp_help_response: null,
    auth0_id: '5c333f907e5da976e1ea4df5',
    favorites: null
  },
  {
    id: 719,
    first_name: 'Yvonne',
    last_name: 'Woodruff',
    email: 'yw@gmail.com',
    phone: '1234567800',
    coach_id: 6,
    org_id: 4,
    internal_id: null,
    color: null,
    goals: [],
    status: 'WORKING',
    type: 'Client',
    created_at: '2019-01-07T12:01:20.705Z',
    updated_at: '2019-01-07T12:01:20.705Z',
    platform: 'FBOOK',
    image: null,
    follow_up_date: null,
    plan_url:
      'http://localhost:3000/plan/U2FsdGVkX18yp6SHt5k%2FUdRKxPJGZVX5B%2Fpl93d8FaY%3D',
    checkin_times: [
      { topic: 'nexttask', message: 'startprompt', time: 3258094836093486908 }
    ],
    topic: null,
    fb_id: 5550,
    temp_help_response: null,
    auth0_id: '5c333f907e5da976e1ea4df5',
    favorites: null
  },
  {
    id: 720,
    first_name: 'Albert',
    last_name: 'Mortensen',
    email: 'am@gmail.com',
    phone: '1234567900',
    coach_id: 6,
    org_id: 4,
    internal_id: null,
    color: null,
    goals: [],
    status: 'WORKING',
    type: 'Client',
    created_at: '2019-01-07T12:01:20.705Z',
    updated_at: '2019-01-07T12:01:20.705Z',
    platform: 'FBOOK',
    image: null,
    follow_up_date: null,
    plan_url:
      'http://localhost:3000/plan/U2FsdGVkX18yp6SHt5k%2FUdRKxPJGZVX5B%2Fpl93d8FaY%3D',
    checkin_times: [
      {
        topic: 'recurring',
        message: 'startprompt',
        time: Date.now(),
        createdDate: new Date(),
        recurringTaskId: 1116
      },
      {
        topic: 'content',
        message: 'startprompt',
        time: 99999992159999292
      }
    ],
    topic: null,
    fb_id: 6550,
    temp_help_response: null,
    auth0_id: '5c333f907e5da976e1ea4df5',
    favorites: null
  },
  {
    id: 721,
    first_name: 'Lydia',
    last_name: 'Sewell',
    email: 'ls@gmail.com',
    phone: '1234565900',
    coach_id: 6,
    org_id: 4,
    internal_id: null,
    color: null,
    goals: [],
    status: 'WORKING',
    type: 'Client',
    created_at: '2019-01-07T12:01:20.705Z',
    updated_at: '2019-01-07T12:01:20.705Z',
    platform: null,
    image: null,
    follow_up_date: new Date(),
    plan_url:
      'http://localhost:3000/plan/U2FsdGVkX18yp6SHt5k%2FUdRKxPJGZVX5B%2Fpl93d8FaY%3D',
    checkin_times: null,
    topic: null,
    fb_id: null,
    temp_help_response: null,
    auth0_id: '5c333f907e5da976e1ea4df5',
    favorites: null
  },
  {
    id: 722,
    first_name: 'Deborah',
    last_name: 'Sharp',
    email: 'ds@gmail.com',
    phone: '1434565900',
    coach_id: 6,
    org_id: 4,
    internal_id: null,
    color: null,
    goals: [],
    status: 'AWAITING_HELP',
    type: 'Client',
    created_at: '2019-01-07T12:01:20.705Z',
    updated_at: '2019-01-07T12:01:20.705Z',
    platform: null,
    image: null,
    follow_up_date: new Date(),
    plan_url:
      'http://localhost:3000/plan/U2FsdGVkX18yp6SHt5k%2FUdRKxPJGZVX5B%2Fpl93d8FaY%3D',
    checkin_times: [
      { topic: 'content', message: 'startprompt', time: 99898325981989898169 }
    ],
    topic: null,
    fb_id: null,
    temp_help_response: null,
    auth0_id: '5c333f907e5da976e1ea4df5',
    favorites: null
  }
];

const orgs = [
  {
    3: {
      id: 3,
      name: 'IDEO.org',
      sms_number: null,
      logo: null,
      phone: null,
      city: 'New York',
      state: 'New York',
      country: 'USA',
      postal_code: '10001',
      street: null
    },
    4: {
      id: 4,
      name: 'Test.org',
      sms_number: null,
      logo: null,
      phone: null,
      city: 'New York',
      state: 'New York',
      country: 'USA',
      postal_code: '10001',
      street: null
    }
  }
];

const mockTasks = [
  {
    template: [
      {
        id: 20,
        title: 'Credit task',
        category: 'CREDIT',
        description: 'description',
        status: 'ACTIVE',
        created_by: 1,
        user_id: null,
        difficulty: null,
        date_created: '2019-01-06T21:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: null,
        steps: null,
        order: 0,
        original_task_id: null,
        coach_org: 1,
        first_name: 'Super',
        shared: null
      },
      {
        id: 13,
        title: 'Credit task',
        category: 'CREDIT',
        description: 'description',
        status: 'ACTIVE',
        created_by: 1,
        user_id: null,
        difficulty: null,
        date_created: '2019-01-03T21:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: null,
        steps: null,
        order: 0,
        original_task_id: null,
        coach_org: 1,
        first_name: 'Super',
        shared: null
      },
      {
        id: 19,
        title: 'Debit task',
        category: 'DEBT',
        description:
          'The description of the PR should contain the following headings and corresponding content in Markdown format.',
        status: 'ACTIVE',
        created_by: 1,
        user_id: null,
        difficulty: null,
        date_created: '2019-01-06T21:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: null,
        steps: null,
        order: 0,
        original_task_id: null,
        coach_org: 1,
        first_name: 'Super',
        shared: null
      },
      {
        id: 12,
        title: 'Debit task',
        category: 'DEBT',
        description:
          'The description of the PR should contain the following headings and corresponding content in Markdown format.',
        status: 'ACTIVE',
        created_by: 1,
        user_id: null,
        difficulty: null,
        date_created: '2019-01-03T21:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: null,
        steps: null,
        order: 0,
        original_task_id: null,
        coach_org: 1,
        first_name: 'Super',
        shared: null
      },
      {
        id: 18,
        title: 'The ultra awesome task',
        category: 'CATEGORY',
        description: 'The ultra awesome task',
        status: 'ACTIVE',
        created_by: 1,
        user_id: null,
        difficulty: null,
        date_created: '2019-01-06T21:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: null,
        steps: null,
        order: 0,
        original_task_id: null,
        coach_org: 1,
        first_name: 'Super',
        shared: null
      },
      {
        id: 11,
        title: 'The ultra awesome task',
        category: 'CATEGORY',
        description: 'The ultra awesome task',
        status: 'ACTIVE',
        created_by: 1,
        user_id: null,
        difficulty: null,
        date_created: '2019-01-03T21:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: null,
        steps: null,
        order: 0,
        original_task_id: null,
        coach_org: 1,
        first_name: 'Super',
        shared: null
      }
    ],
    recurring: {
      1116: {
        id: 1116,
        title: 'Create a debt repayment plan',
        category: 'DEBT',
        description:
          'If you have the means to put some of your income toward your debt, the following steps can help you prioritize the allocation of those funds to become debt-free faster.',
        status: 'ACTIVE',
        created_by: 6,
        user_id: null,
        difficulty: 'MODERATE',
        date_created: '2018-11-30T00:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: {
          duration: '1',
          frequency: '5'
        },
        steps: [
          {
            text:
              'List all of your debts. For each debt, include the lender, balance, minimum payment, interest rate, and monthly due date.',
            note: null
          },
          {
            text:
              "If your credit score has improved since you've opened your credit cards, try asking for a lower Annual Percentage Rate (APR) on each of your credit cards. This could reduce your monthly payments and the total amount of interest you will pay for credit card debt. Here is a script for negotiating interest rates on credit cards: http://www.creditcards.com/credit-card-news/script-negotiate-better-credit-card-deal-1267.php",
            note: null
          },
          {
            text:
              'List all income and expenses (including minimum monthly debt payments), and determine how much you have available every month to pay toward your debt. List all savings and decide how much you would like to contribute toward paying down your debt. Tip: Prioritize payments toward the highest interest rate debts.',
            note: null
          }
        ],
        order: 0,
        original_task_id: null,
        coach_org: 4,
        first_name: 'Roo',
        shared: false
      },
      1118: {
        id: 1118,
        title: 'Create a debt repayment plan',
        category: 'DEBT',
        description:
          'If you have the means to put some of your income toward your debt, the following steps can help you prioritize the allocation of those funds to become debt-free faster.',
        status: 'ACTIVE',
        created_by: 6,
        user_id: 720,
        difficulty: 'MODERATE',
        date_created: '2018-11-30T00:00:00.000Z',
        date_completed: null,
        date_assigned: '2018-12-01T00:00:00.000Z',
        recurring: {
          duration: '4',
          frequency: '5'
        },
        steps: [
          {
            text:
              'List all of your debts. For each debt, include the lender, balance, minimum payment, interest rate, and monthly due date.',
            note: null
          },
          {
            text:
              "If your credit score has improved since you've opened your credit cards, try asking for a lower Annual Percentage Rate (APR) on each of your credit cards. This could reduce your monthly payments and the total amount of interest you will pay for credit card debt. Here is a script for negotiating interest rates on credit cards: http://www.creditcards.com/credit-card-news/script-negotiate-better-credit-card-deal-1267.php",
            note: null
          },
          {
            text:
              'List all income and expenses (including minimum monthly debt payments), and determine how much you have available every month to pay toward your debt. List all savings and decide how much you would like to contribute toward paying down your debt. Tip: Prioritize payments toward the highest interest rate debts.',
            note: null
          }
        ],
        order: 0,
        original_task_id: null,
        coach_org: 4,
        first_name: 'Roo',
        shared: false
      }
    },
    717: [
      {
        id: 24,
        title: 'Create a debt repayment plan',
        category: 'DEBT',
        description:
          'If you have the means to put some of your income toward your debt, the following steps can help you prioritize the allocation of those funds to become debt-free faster.',
        status: 'ACTIVE',
        created_by: 6,
        user_id: 717,
        difficulty: 'MODERATE',
        date_created: '2018-11-30T00:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: null,
        steps: [
          {
            text:
              'List all of your debts. For each debt, include the lender, balance, minimum payment, interest rate, and monthly due date.',
            note: null
          },
          {
            text:
              "If your credit score has improved since you've opened your credit cards, try asking for a lower Annual Percentage Rate (APR) on each of your credit cards. This could reduce your monthly payments and the total amount of interest you will pay for credit card debt. Here is a script for negotiating interest rates on credit cards: http://www.creditcards.com/credit-card-news/script-negotiate-better-credit-card-deal-1267.php",
            note: null
          },
          {
            text:
              'List all income and expenses (including minimum monthly debt payments), and determine how much you have available every month to pay toward your debt. List all savings and decide how much you would like to contribute toward paying down your debt. Tip: Prioritize payments toward the highest interest rate debts.',
            note: null
          }
        ],
        order: 0,
        original_task_id: null,
        coach_org: 4,
        first_name: 'Roo',
        shared: false
      },
      {
        id: 25,
        title: 'Contact your utility company',
        category: 'DEBT',
        description:
          'Enrolling in Budget Billing with your utility company will help very much.',
        status: 'ACTIVE',
        created_by: 6,
        user_id: 717,
        difficulty: 'MODERATE',
        date_created: '2018-11-30T00:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: null,
        steps: [
          {
            text: 'Step 1: Call your utility company.',
            note: null
          }
        ],
        order: 0,
        original_task_id: null,
        coach_org: 4,
        first_name: 'Roo',
        shared: false
      }
    ],
    112: [
      {
        id: 26,
        title: 'Create a debt repayment plan',
        category: 'DEBT',
        description:
          'If you have the means to put some of your income toward your debt, the following steps can help you prioritize the allocation of those funds to become debt-free faster.',
        status: 'ACTIVE',
        created_by: 6,
        user_id: 112,
        difficulty: 'MODERATE',
        date_created: '2018-11-30T00:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: null,
        steps: [
          {
            text:
              'List all of your debts. For each debt, include the lender, balance, minimum payment, interest rate, and monthly due date.',
            note: null
          },
          {
            text:
              'For collection or judgment accounts, seek a pro bono (free) consumer debt attorney for assistance: https://www.lawhelp.org/find-help/. They may also advise on whether or not you would be a candidate for bankruptcy.',
            note: 'Recommend a local referral.'
          },
          {
            text:
              'Adjust your monthly income and expenses list, and include any minimum and extra payments toward debt as an expense. If possible, set automatic extra payments toward debts.',
            note: null
          },
          {
            text:
              "If you would like help creating a debt repayment plan, here are three options:\nSchedule a meeting with your financial coach.\nOR\nTalk to a credit counselor. The National Federation of Credit Counselors (NFCC) agency assists borrowers who are having difficulty paying their debt. If you can't pay your bills on time consistently each month, then you may want to get personalized advice from a counselor. Talk to a counselor to understand what your options are. There may be a fee for these services. You can find an NFCC member agency here: https://www.nfcc.org/\nOR\nVisit a local credit union, ideally a Community Development Credit Union. You may be able to refinance credit card debt, auto loans, or other consumer debt, into loans with lower interest rates at a credit union. This could save you money on interest payments each month and make more room in your budget. Some CDCUs also offer financial counseling to help you reach your financial goals. You can find your nearest CDCU here: http://www.cdcu.coop/membership/membership-directory/",
            note:
              'For scheduling, insert a scheduling link for the client to make an appointment with a financial coach. Or if your organization refers out for this type of support, include the referral here. If you know any local providers that would be better, insert them here.'
          }
        ],
        order: 0,
        original_task_id: null,
        coach_org: 4,
        first_name: 'Roo',
        shared: false
      },
      {
        id: 27,
        title: 'Contact your utility company',
        category: 'DEBT',
        description:
          'Enrolling in Budget Billing with your utility company will help alot.',
        status: 'ACTIVE',
        created_by: 6,
        user_id: 112,
        difficulty: 'MODERATE',
        date_created: '2018-11-30T00:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: null,
        steps: [
          {
            text: 'Call your utility company.',
            note: null
          }
        ],
        order: 0,
        original_task_id: null,
        coach_org: 4,
        first_name: 'Roo',
        shared: false
      }
    ],
    113: [
      {
        id: 1116,
        title: 'Create a debt repayment plan',
        category: 'DEBT',
        description:
          'If you have the means to put some of your income toward your debt, the following steps can help you prioritize the allocation of those funds to become debt-free faster.',
        status: 'ACTIVE',
        created_by: 6,
        user_id: 113,
        difficulty: 'MODERATE',
        date_created: '2018-11-30T00:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: {
          duration: '1',
          frequency: '5'
        },
        steps: [
          {
            text:
              'List all of your debts. For each debt, include the lender, balance, minimum payment, interest rate, and monthly due date.',
            note: null
          },
          {
            text:
              "If your credit score has improved since you've opened your credit cards, try asking for a lower Annual Percentage Rate (APR) on each of your credit cards. This could reduce your monthly payments and the total amount of interest you will pay for credit card debt. Here is a script for negotiating interest rates on credit cards: http://www.creditcards.com/credit-card-news/script-negotiate-better-credit-card-deal-1267.php",
            note: null
          },
          {
            text:
              'List all income and expenses (including minimum monthly debt payments), and determine how much you have available every month to pay toward your debt. List all savings and decide how much you would like to contribute toward paying down your debt. Tip: Prioritize payments toward the highest interest rate debts.',
            note: null
          }
        ],
        order: 0,
        original_task_id: null,
        coach_org: 4,
        first_name: 'Roo',
        shared: false
      },
      {
        id: 1117,
        title: 'Create a debt repayment plan',
        category: 'DEBT',
        description:
          'If you have the means to put some of your income toward your debt, the following steps can help you prioritize the allocation of those funds to become debt-free faster.',
        status: 'ACTIVE',
        created_by: 6,
        user_id: 113,
        difficulty: 'MODERATE',
        date_created: '2018-11-30T00:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: {
          duration: '4',
          frequency: '5'
        },
        steps: [
          {
            text:
              'List all of your debts. For each debt, include the lender, balance, minimum payment, interest rate, and monthly due date.',
            note: null
          },
          {
            text:
              "If your credit score has improved since you've opened your credit cards, try asking for a lower Annual Percentage Rate (APR) on each of your credit cards. This could reduce your monthly payments and the total amount of interest you will pay for credit card debt. Here is a script for negotiating interest rates on credit cards: http://www.creditcards.com/credit-card-news/script-negotiate-better-credit-card-deal-1267.php",
            note: null
          },
          {
            text:
              'List all income and expenses (including minimum monthly debt payments), and determine how much you have available every month to pay toward your debt. List all savings and decide how much you would like to contribute toward paying down your debt. Tip: Prioritize payments toward the highest interest rate debts.',
            note: null
          }
        ],
        order: 0,
        original_task_id: null,
        coach_org: 4,
        first_name: 'Roo',
        shared: false
      }
    ],
    718: [],
    719: [
      {
        id: 1117,
        title: 'Create a debt repayment plan',
        category: 'DEBT',
        description:
          'If you have the means to put some of your income toward your debt, the following steps can help you prioritize the allocation of those funds to become debt-free faster.',
        status: 'COMPLETED',
        created_by: 6,
        user_id: 719,
        difficulty: 'MODERATE',
        date_created: '2018-11-30T00:00:00.000Z',
        date_completed: '2018-12-02T00:00:00.000Z',
        date_assigned: '2018-12-01T00:00:00.000Z',
        recurring: null,
        steps: [
          {
            text:
              'List all of your debts. For each debt, include the lender, balance, minimum payment, interest rate, and monthly due date.',
            note: null
          },
          {
            text:
              "If your credit score has improved since you've opened your credit cards, try asking for a lower Annual Percentage Rate (APR) on each of your credit cards. This could reduce your monthly payments and the total amount of interest you will pay for credit card debt. Here is a script for negotiating interest rates on credit cards: http://www.creditcards.com/credit-card-news/script-negotiate-better-credit-card-deal-1267.php",
            note: null
          },
          {
            text:
              'List all income and expenses (including minimum monthly debt payments), and determine how much you have available every month to pay toward your debt. List all savings and decide how much you would like to contribute toward paying down your debt. Tip: Prioritize payments toward the highest interest rate debts.',
            note: null
          }
        ],
        order: 0,
        original_task_id: null,
        coach_org: 4,
        first_name: 'Roo',
        shared: false
      }
    ],
    720: [
      {
        id: 1118,
        title: 'Create a debt repayment plan',
        category: 'DEBT',
        description:
          'If you have the means to put some of your income toward your debt, the following steps can help you prioritize the allocation of those funds to become debt-free faster.',
        status: 'ACTIVE',
        created_by: 6,
        user_id: 720,
        difficulty: 'MODERATE',
        date_created: '2018-11-30T00:00:00.000Z',
        date_completed: null,
        date_assigned: '2018-12-01T00:00:00.000Z',
        recurring: {
          duration: '4',
          frequency: '5'
        },
        steps: [
          {
            text:
              'List all of your debts. For each debt, include the lender, balance, minimum payment, interest rate, and monthly due date.',
            note: null
          },
          {
            text:
              "If your credit score has improved since you've opened your credit cards, try asking for a lower Annual Percentage Rate (APR) on each of your credit cards. This could reduce your monthly payments and the total amount of interest you will pay for credit card debt. Here is a script for negotiating interest rates on credit cards: http://www.creditcards.com/credit-card-news/script-negotiate-better-credit-card-deal-1267.php",
            note: null
          },
          {
            text:
              'List all income and expenses (including minimum monthly debt payments), and determine how much you have available every month to pay toward your debt. List all savings and decide how much you would like to contribute toward paying down your debt. Tip: Prioritize payments toward the highest interest rate debts.',
            note: null
          }
        ],
        order: 0,
        original_task_id: null,
        coach_org: 4,
        first_name: 'Roo',
        shared: false
      }
    ],
    721: [],
    722: [
      {
        id: 11111,
        title: 'The ultra awesome task',
        category: 'CATEGORY',
        description: 'The ultra awesome task',
        status: 'ACTIVE',
        created_by: 1,
        user_id: 722,
        difficulty: null,
        date_created: '2019-01-03T21:00:00.000Z',
        date_completed: null,
        date_assigned: null,
        recurring: null,
        steps: null,
        order: 0,
        original_task_id: null,
        coach_org: 1,
        first_name: 'Super',
        shared: null
      }
    ]
  }
];

const media = [
  {
    id: 12,
    task_id: null,
    title: "Nicole's Story",
    category: 'PODCAST',
    description:
      "Check out Nicole's story and learn how financial coaching helped her.",
    url: 'https://soundcloud.com/roothebot/nicole',
    image:
      'https://s3.amazonaws.com/steps-application-public/media_assets/podcast_nicole_600_900.jpg',
    published_by: 100,
    type: 'STORY'
  },
  {
    id: 13,
    task_id: null,
    title: "Todrick's Story",
    category: 'STORY',
    description:
      "Check out Todrick's story and learn how financial coaching helped him.",
    url: 'https://readymag.com/u32761257/1083545/',
    image:
      'https://s3.amazonaws.com/steps-application-public/media_assets/story_todrick.png',
    published_by: 100,
    type: 'STORY'
  },
  {
    id: 14,
    task_id: null,
    title: "Tamika's Story",
    category: 'PODCAST',
    description:
      "Check out Tamika's story and learn how financial coaching helped her.",
    url: 'https://soundcloud.com/roothebot/tamika',
    image:
      'https://s3.amazonaws.com/steps-application-public/media_assets/podcast_tamika_600_900.jpg',
    published_by: 100,
    type: 'STORY'
  },
  {
    id: 15,
    task_id: null,
    title: "Gail's story",
    category: 'STORY',
    description:
      "Check out Gail's story and learn how financial coaching helped her.",
    url: 'https://readymag.com/u32761257/1083437/',
    image:
      'https://s3.amazonaws.com/steps-application-public/media_assets/story_gail.png',
    published_by: 100,
    type: 'STORY'
  },
  {
    id: 16,
    task_id: null,
    title: "Godfrey's Story",
    category: 'PODCAST',
    description:
      "Check out Godfrey's story and learn how financial coaching helped him.",
    url: 'https://soundcloud.com/roothebot/godfrey',
    image:
      'https://s3.amazonaws.com/steps-application-public/media_assets/podcast_godfrey_600_900.jpg',
    published_by: 100,
    type: 'STORY'
  },
  {
    id: 17,
    task_id: null,
    title: "Allene's Story",
    category: 'STORY',
    description:
      "Check out Allene's story and learn how financial coaching helped her.",
    url: 'https://readymag.com/u32761257/1083521/',
    image:
      'https://s3.amazonaws.com/steps-application-public/media_assets/story_allene.png\n',
    published_by: 100,
    type: 'STORY'
  },
  {
    id: 18,
    task_id: null,
    title: "Gemyra's Story",
    category: 'STORY',
    description:
      "Check out Gemyra's story and learn how financial coaching helped her.",
    url: 'https://readymag.com/u32761257/1083531/',
    image:
      'https://s3.amazonaws.com/steps-application-public/media_assets/story_gemyra.png',
    published_by: 100,
    type: 'STORY'
  },
  {
    id: 19,
    task_id: null,
    title: "Nyree's Story",
    category: 'PODCAST',
    description:
      "Check out Nyree's story and learn how financial coaching helped her.",
    url: 'https://soundcloud.com/roothebot/nyree',
    image:
      'https://s3.amazonaws.com/steps-application-public/media_assets/podcast_nyree_600_900.jpg',
    published_by: 100,
    type: 'STORY'
  },
  {
    id: 20,
    task_id: null,
    title: "Robert's Story",
    category: 'STORY',
    description:
      "Check out Robert's story and learn how financial coaching helped him.",
    url: 'https://soundcloud.com/roothebot/robert',
    image:
      'https://s3.amazonaws.com/steps-application-public/media_assets/podcast_robert_600_900.jpg',
    published_by: 100,
    type: 'STORY'
  },
  {
    id: 21,
    task_id: null,
    title: 'Steps to better money management',
    category: 'LINK',
    description: 'A short video with strategies for your financial future.',
    url: 'https://www.youtube.com/watch?v=CU4l_rs50Kk',
    image:
      'https://s3.amazonaws.com/steps-application-public/media_assets/bookmark_learn.png',
    published_by: 100,
    type: 'GENERAL_EDUCATION'
  },
  {
    id: 22,
    task_id: null,
    title: '5 steps for making financial decisions',
    category: 'LINK',
    description: 'A short article with tips for smart money choices.',
    url:
      'https://s3.amazonaws.com/steps-application-public/media_assets/5_steps_for_making_financial_decisions.pdf',
    image:
      'https://s3.amazonaws.com/steps-application-public/media_assets/bookmark_learn.png',
    published_by: 100,
    type: 'GENERAL_EDUCATION'
  }
];

const mockCoach = {
  id: 1295,
  first_name: 'Michael',
  last_name: 'Micah',
  email: 'micahoriaso+stg_coach@gmail.com',
  phone: null,
  coach_id: null,
  org_id: 855,
  internal_id: null,
  color: null,
  goals: [],
  status: 'WORKING',
  type: 'Coach',
  created_at: '2018-12-20T11:32:28.534Z',
  updated_at: '2018-12-20T11:32:28.534Z',
  platform: null,
  image: null,
  follow_up_date: null,
  plan_url: null,
  checkin_times: null,
  topic: null,
  fb_id: null,
  temp_help_response: null,
  auth0_id: '5c1b7dccf280a748c3eca115',
  favorites: null
};

const taskList = [
  {
    id: 779,
    title: 'Buy cake',
    category: 'custom',
    description: 'Cake good. ',
    status: 'COMPLETED',
    recurring: null,
    steps: [
      {
        text: 'Earn dollar. '
      },
      {
        text: 'Eat cake. '
      }
    ],
    order: 0,
    original_task_id: null
  },
  {
    id: 422,
    title: 'Recurring Task',
    description:
      'If you want or need more income, you might be able to get it from current employment.',
    status: 'ACTIVE',
    recurring: {
      frequency: 1,
      duration: 30
    },
    steps: [
      {
        text:
          'Read the employee handbook to learn about the process of getting a raise at your company.',
        note: null
      }
    ],
    order: 1
  },
  {
    id: 777,
    title: 'Ask for a raise at work',
    description:
      'If you want or need more income, you might be able to get it from current employment.',
    status: 'ACTIVE',
    recurring: null,
    steps: [
      {
        text:
          'Read the employee handbook to learn about the process of getting a raise at your company.',
        note: null
      },
      {
        text:
          'Schedule a time to speak with your manager, or once you see that they are available ask if they can speak privately.',
        note: null
      }
    ],
    order: 2
  }
];

const viewedMediaIDs = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21];
const viewedAllMediaIDs = [12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

module.exports = {
  clients,
  orgs,
  mockTasks,
  media,
  mockCoach,
  viewedMediaIDs,
  viewedAllMediaIDs,
  taskList
};
