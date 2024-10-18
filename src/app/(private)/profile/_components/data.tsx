export const subscriptionPlans = [
  {
    name: "Basic",
    features: [
      "Access to 5 tasks per month",
      "Unlimited messaging with freelancers",
      "Standard support response time",
    ],
    price: {
      perMonth: 9.99,
      perYear: 99.99,
    },
    maximumTasks: 5,
  },
  {
    name: "Standard",
    features: [
      "Access to 15 tasks per month",
      "Priority messaging with freelancers",
      "Faster support response time",
      "Access to exclusive job postings",
    ],
    price: {
      perMonth: 13.99,
      perYear: 139.99,
    },
    maximumTasks: 15,
  },
  {
    name: "Premium",
    features: [
      "Access to 30 tasks per month",
      "Priority support with dedicated account manager",
      "Exclusive access to premium freelancers",
      "Ability to post projects with higher visibility",
    ],
    price: {
      perMonth: 16.99,
      perYear: 169.99,
    },
    maximumTasks: 30,
  },
  {
    name: "Family",
    features: [
      "Access to 50 tasks per month",
      "All Premium features",
      "Unlimited messaging with freelancers",
      "Access to premium job postings",
      "Monthly check-ins with account manager",
    ],
    price: {
      perMonth: 19.99,
      perYear: 199.99,
    },
    maximumTasks: 50,
  },
];
