import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="grid lg:grid-cols-3 h-screen">
      <div className="bg-primary lg:col-span-2 hidden lg:flex lg:items-center lg:justify-center p-8">
        <div className="text-white">
          <h1 className="font-bold text-5xl mb-4">Gigfolio: Showcase Your Expertise</h1>
          <p className="text-base">
            Welcome to Gigfolio, the platform where freelancers craft stunning portfolios to display their skills and projects. 
            Whether you're a designer, writer, developer, or creative professional, Gigfolio empowers you to present your work 
            in the most captivating way. Join a community of talented individuals, showcase your expertise, and attract clients 
            who value your craft. Start building a portfolio that speaks volumes about your professional journey.
          </p>
        </div>
      </div>
      <div className="bg-primary lg:col-span-1 flex items-center justify-center p-8">
        <SignUp />
      </div>
    </div>
  );
}
