import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { 
  ArrowRight, 
  Code, 
  Cpu, 
  Check, 
  Globe, 
  Users, 
  Zap, 
  MessageSquare, 
  CreditCard,
  Star
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full backdrop-blur-sm bg-background/80 z-10 border-b border-border">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center">
            <span className="font-heading font-bold text-2xl text-primary">FourByte</span>
          </div>
          <div className="hidden md:flex space-x-6 text-sm">
            <a href="#services" className="hover:text-primary transition">Services</a>
            <a href="#process" className="hover:text-primary transition">Process</a>
            <a href="#testimonials" className="hover:text-primary transition">Testimonials</a>
            <a href="#pricing" className="hover:text-primary transition">Pricing</a>
            <a href="#contact" className="hover:text-primary transition">Contact</a>
          </div>
          <div className="flex space-x-3">
            <Link href="/auth">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/auth">
              <Button size="sm">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold tracking-tight">
                Bring Your App Ideas <span className="text-primary">to Life</span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                FourByte is your trusted partner for custom application development.
                We transform ideas into powerful, user-friendly applications with cutting-edge technology.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/auth">
                  <Button size="lg" className="px-8">
                    Start Your Project
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#process">
                  <Button variant="outline" size="lg">
                    How It Works
                  </Button>
                </a>
              </div>
              <div className="mt-8 flex items-center gap-2 text-sm">
                <div className="flex -space-x-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={`w-8 h-8 rounded-full border-2 border-background bg-primary-${i * 100} flex items-center justify-center text-xs text-white`}>
                      <Star className="h-3 w-3" />
                    </div>
                  ))}
                </div>
                <span className="text-muted-foreground">
                  <strong>4.9/5</strong> from over 200 client reviews
                </span>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden border border-border bg-card p-1">
              <div className="absolute top-2 left-2 h-4 w-4 rounded-full bg-red-500"></div>
              <div className="absolute top-2 left-8 h-4 w-4 rounded-full bg-yellow-500"></div>
              <div className="absolute top-2 left-14 h-4 w-4 rounded-full bg-green-500"></div>
              <div className="pt-6 pb-4 px-4 rounded-lg bg-muted/50 text-sm font-mono">
                <div className="text-muted-foreground">// FourByte applications</div>
                <div className="mt-2">
                  <span className="text-blue-500">const</span>{" "}
                  <span className="text-green-500">success</span> = {"{"}
                </div>
                <div className="ml-4">
                  <span className="text-violet-500">quality</span>:{" "}
                  <span className="text-amber-500">'exceptional'</span>,
                </div>
                <div className="ml-4">
                  <span className="text-violet-500">delivery</span>:{" "}
                  <span className="text-amber-500">'on-time'</span>,
                </div>
                <div className="ml-4">
                  <span className="text-violet-500">support</span>:{" "}
                  <span className="text-amber-500">'24/7'</span>,
                </div>
                <div className="ml-4">
                  <span className="text-violet-500">satisfaction</span>:{" "}
                  <span className="text-amber-500">'guaranteed'</span>
                </div>
                <div>{"}"}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto">
          <p className="text-center text-sm uppercase text-muted-foreground mb-6 tracking-wide">
            Trusted by innovative companies
          </p>
          <div className="flex justify-center flex-wrap gap-8 md:gap-16">
            {["Company A", "Company B", "Company C", "Company D", "Company E"].map((company, i) => (
              <div key={i} className="text-muted-foreground/70 font-heading font-semibold text-xl">
                {company}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              Comprehensive Development Services
            </h2>
            <p className="mt-4 text-muted-foreground">
              We offer end-to-end solutions for all your application development needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Code className="h-6 w-6" />,
                title: "Web Application Development",
                description: "Custom web applications with responsive design and modern frameworks"
              },
              {
                icon: <Cpu className="h-6 w-6" />,
                title: "Mobile App Development",
                description: "Native and cross-platform mobile applications for iOS and Android"
              },
              {
                icon: <Globe className="h-6 w-6" />,
                title: "E-Commerce Solutions",
                description: "Secure and scalable online stores with integrated payment systems"
              },
              {
                icon: <Zap className="h-6 w-6" />,
                title: "Enterprise Software",
                description: "Custom business applications to streamline operations and improve efficiency"
              },
              {
                icon: <Users className="h-6 w-6" />,
                title: "UX/UI Design",
                description: "Intuitive and engaging user experience design for your applications"
              },
              {
                icon: <MessageSquare className="h-6 w-6" />,
                title: "Maintenance & Support",
                description: "Ongoing support and updates to keep your applications running smoothly"
              }
            ].map((service, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition">
                <div className="h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center text-primary mb-4">
                  {service.icon}
                </div>
                <h3 className="text-xl font-heading font-semibold mb-2">{service.title}</h3>
                <p className="text-muted-foreground">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section id="process" className="py-20 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              Our Development Process
            </h2>
            <p className="mt-4 text-muted-foreground">
              A transparent and collaborative approach to bring your vision to reality
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Discovery & Planning",
                description: "We analyze your requirements and create a detailed project plan"
              },
              {
                step: "02",
                title: "Design & Prototyping",
                description: "Creating wireframes and interactive prototypes for your approval"
              },
              {
                step: "03",
                title: "Development",
                description: "Building your application with regular updates and milestone reviews"
              },
              {
                step: "04",
                title: "Testing & Launch",
                description: "Rigorous quality testing before launching your application"
              }
            ].map((process, i) => (
              <div key={i} className="relative">
                <div className="text-4xl font-bold text-primary/20 mb-2">{process.step}</div>
                <h3 className="text-xl font-heading font-semibold mb-2">{process.title}</h3>
                <p className="text-muted-foreground">{process.description}</p>
                {i < 3 && (
                  <div className="hidden lg:block absolute top-8 right-0 w-1/2 h-[2px] bg-primary/20"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              What Our Clients Say
            </h2>
            <p className="mt-4 text-muted-foreground">
              Don't just take our word for it - hear from some of our satisfied clients
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                name: "Sarah Johnson",
                role: "CEO, TechStart Inc.",
                content: "FourByte delivered our application ahead of schedule and exceeded our expectations. Their team was professional, responsive, and truly cared about our project's success."
              },
              {
                name: "Michael Chang",
                role: "Founder, RetailPlus",
                content: "Working with FourByte was a game-changer for our business. They transformed our complex requirements into an intuitive application that our customers love."
              },
              {
                name: "Emma Rodriguez",
                role: "CTO, HealthConnect",
                content: "The expertise and dedication of the FourByte team made all the difference. They navigated complex technical challenges with ease and delivered a flawless product."
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-1 text-yellow-500 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="mb-6 italic">"{testimonial.content}"</p>
                <div className="mt-4">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold">
              Transparent Pricing Plans
            </h2>
            <p className="mt-4 text-muted-foreground">
              Choose the right package for your project needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Startup",
                price: "$2,999",
                description: "Perfect for small businesses and startups",
                features: [
                  "Basic web application",
                  "Responsive design",
                  "2 weeks delivery",
                  "1 month support",
                  "1 revision round"
                ]
              },
              {
                name: "Business",
                price: "$5,999",
                description: "Ideal for growing businesses with specific needs",
                features: [
                  "Advanced web application",
                  "Mobile responsive design",
                  "Admin dashboard",
                  "4 weeks delivery",
                  "3 months support",
                  "3 revision rounds",
                  "API integration"
                ],
                highlighted: true
              },
              {
                name: "Enterprise",
                price: "Custom",
                description: "Tailored solutions for large organizations",
                features: [
                  "Complex application systems",
                  "Custom integrations",
                  "Dedicated project manager",
                  "Custom timeline",
                  "12 months support",
                  "Unlimited revisions",
                  "24/7 priority support"
                ]
              }
            ].map((plan, i) => (
              <div 
                key={i} 
                className={`bg-card border rounded-lg p-6 ${
                  plan.highlighted 
                    ? "border-primary relative shadow-lg" 
                    : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-white text-xs px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-heading font-semibold">{plan.name}</h3>
                  <div className="mt-4 mb-2">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    {plan.name !== "Enterprise" && <span className="text-muted-foreground">/project</span>}
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                </div>
                <div className="space-y-3 mb-6">
                  {plan.features.map((feature, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                <Link href="/auth">
                  <Button 
                    className="w-full" 
                    variant={plan.highlighted ? "default" : "outline"}
                  >
                    {plan.name === "Enterprise" ? "Contact Us" : "Get Started"}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="contact" className="py-20">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto bg-card border border-border rounded-lg p-8 md:p-12 text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              Ready to Start Your Project?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Get in touch with our team today and let's transform your idea into a powerful application
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="px-8">
                  Start Your Project
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                Schedule a Call
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted/30 border-t border-border">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="font-heading font-bold text-2xl text-primary mb-4">FourByte</div>
              <p className="text-sm text-muted-foreground mb-4">
                Transforming ideas into powerful applications with cutting-edge technology.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <span className="sr-only">Twitter</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <span className="sr-only">GitHub</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                    <path d="M9 18c-4.51 2-5-2-7-2" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary">
                  <span className="sr-only">LinkedIn</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
                    <rect width="4" height="12" x="2" y="9" />
                    <circle cx="4" cy="4" r="2" />
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Services</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Web Development</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Mobile Development</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">E-Commerce</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Enterprise Software</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">UX/UI Design</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">About Us</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Our Team</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Careers</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Blog</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Contact Us</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-6 border-t border-border text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} FourByte. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}