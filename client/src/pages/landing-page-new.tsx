import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Check, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export default function LandingPageNew() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

  // Handle navbar transparency on scroll
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden bg-black text-white">
      {/* Navbar */}
      <nav className={cn(
        "fixed top-0 left-0 w-full transition-all duration-300 z-50",
        isScrolled ? "bg-black/80 backdrop-blur-md py-4" : "bg-black/30 py-6"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-xl font-bold mr-8 text-white">FourByte</span>
            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-sm text-white hover:text-white/80">Features</a>
              <a href="#testimonials" className="text-sm text-white hover:text-white/80">Testimonials</a>
              <a href="#pricing" className="text-sm text-white hover:text-white/80">Pricing</a>
              <Link href="/feedback" className="text-sm text-white hover:text-white/80">Feedback</Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="default" className="bg-white text-black hover:bg-white/90">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/auth">
                  <Button variant="outline" className="text-white border-white/20 hover:bg-white/10">Sign in</Button>
                </Link>
                <Link href="/auth">
                  <Button variant="default" className="bg-white text-black hover:bg-white/90">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
            <button className="md:hidden text-white" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-black/95 backdrop-blur-md border-t border-white/10 mt-4">
            <div className="px-4 py-6 space-y-4">
              <a 
                href="#features" 
                className="block py-2 text-white/80 hover:text-white" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </a>
              <a 
                href="#testimonials" 
                className="block py-2 text-white/80 hover:text-white" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Testimonials
              </a>
              <a 
                href="#pricing" 
                className="block py-2 text-white/80 hover:text-white" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <Link 
                href="/feedback"
                className="block py-2 text-white/80 hover:text-white" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Feedback
              </Link>
              {!user && (
                <div className="pt-4 border-t border-white/10 mt-4 space-y-3">
                  <Link href="/auth">
                    <Button variant="outline" className="w-full text-white border-white/20 hover:bg-white/10">
                      Sign in
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button variant="default" className="w-full bg-white text-black hover:bg-white/90">
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="relative">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-500 opacity-50 rounded-full blur-3xl"></div>
          <div className="absolute top-40 right-0 w-[500px] h-[500px] bg-indigo-600 opacity-50 rounded-full blur-3xl"></div>
          <div className="absolute bottom-40 -left-20 w-72 h-72 bg-blue-500 opacity-30 rounded-full blur-3xl"></div>
        </div>
        
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/80 z-10"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-32 pb-20 relative z-20">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6 text-white">
              Launch your product <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">with confidence</span>
            </h1>
            <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
              FourByte helps you build stunning digital experiences that delight your customers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-white text-black hover:bg-white/90 px-8">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="border-white/20 hover:bg-white/10 px-8">
                  Learn More
                </Button>
              </a>
            </div>
          </div>
        </div>
      </div>
      
      {/* Logo Cloud */}
      <div className="bg-black border-y border-white/10 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p className="text-center text-sm uppercase text-white/50 mb-6 tracking-wider">
            Trusted by innovative companies
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-8">
            {["Company A", "Company B", "Company C", "Company D", "Company E"].map((company, i) => (
              <div key={i} className="text-white/40 font-bold text-xl flex items-center">
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div id="features" className="py-24 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to succeed
            </h2>
            <p className="text-white/70">
              Our platform provides all the tools necessary to launch and grow your product.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Fast Development",
                description: "Build and deploy in record time with our streamlined development process and tools."
              },
              {
                title: "Flexible Design",
                description: "Create beautiful, responsive user interfaces that adapt to any device or screen size."
              },
              {
                title: "Powerful Analytics",
                description: "Gain valuable insights into user behavior and optimize your product accordingly."
              },
              {
                title: "Seamless Integration",
                description: "Connect with the tools you already use with our comprehensive API and integrations."
              },
              {
                title: "Top-tier Security",
                description: "Keep your data safe with enterprise-grade security features and compliance standards."
              },
              {
                title: "Ongoing Support",
                description: "Get help when you need it with our dedicated support team and comprehensive documentation."
              }
            ].map((feature, i) => (
              <div key={i} className="bg-white/5 rounded-2xl p-6 border border-white/10 hover:border-white/20 transition">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
                  <span className="text-white font-bold">{i + 1}</span>
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-white/70">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Testimonials */}
      <div id="testimonials" className="py-24 bg-black relative">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className="absolute top-20 -right-40 w-96 h-96 bg-indigo-500 opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 -left-40 w-96 h-96 bg-purple-500 opacity-10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Loved by businesses worldwide
            </h2>
            <p className="text-white/70">
              Here's what our customers have to say about their experience with FourByte.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                quote: "FourByte has transformed our business. We're now able to deliver faster and with higher quality than ever before.",
                author: "Jane Smith",
                role: "CEO, TechStart"
              },
              {
                quote: "The development process was seamless, and the end result exceeded our expectations. Couldn't be happier with the service.",
                author: "Michael Johnson",
                role: "CTO, InnovateCorp"
              },
              {
                quote: "Their attention to detail and commitment to quality is unmatched. Our app has received outstanding feedback from users.",
                author: "Sarah Williams",
                role: "Product Manager, GrowthLabs"
              }
            ].map((testimonial, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all shadow-xl">
                <svg width="45" height="36" className="mb-5 text-white/40" viewBox="0 0 45 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M13.4 36C11.2 36 9.33333 35.2 7.8 33.6C6.26667 32 5.5 30.0667 5.5 27.8C5.5 25.8 6.06667 23.8667 7.2 22C8.33333 20.1333 9.86667 18.4667 11.8 17C13.7333 15.5333 15.9333 14.2667 18.4 13.2C20.8667 12.1333 23.4 11.2667 26 10.6L28.9 14.8C25.5667 15.6 22.5333 16.7333 19.8 18.2C17.0667 19.6667 15.1333 21.2667 14 23C14.8 22.7333 15.6 22.6 16.4 22.6C18.5333 22.6 20.3333 23.4 21.8 25C23.2667 26.6 24 28.5333 24 30.8C24 33.0667 23.2 34.9333 21.6 36.4C20 37.8667 17.9333 38.6 15.4 38.6C15.1333 38.6 14.6 38.6 13.8 38.6C13 38.6 12.5333 38.6 12.4 38.6L13.4 36ZM34.6 36C32.4 36 30.5333 35.2 29 33.6C27.4667 32 26.7 30.0667 26.7 27.8C26.7 25.8 27.2667 23.8667 28.4 22C29.5333 20.1333 31.0667 18.4667 33 17C34.9333 15.5333 37.1333 14.2667 39.6 13.2C42.0667 12.1333 44.6 11.2667 47.2 10.6L50.1 14.8C46.7667 15.6 43.7333 16.7333 41 18.2C38.2667 19.6667 36.3333 21.2667 35.2 23C36 22.7333 36.8 22.6 37.6 22.6C39.7333 22.6 41.5333 23.4 43 25C44.4667 26.6 45.2 28.5333 45.2 30.8C45.2 33.0667 44.4 34.9333 42.8 36.4C41.2 37.8667 39.1333 38.6 36.6 38.6C36.3333 38.6 35.8 38.6 35 38.6C34.2 38.6 33.7333 38.6 33.6 38.6L34.6 36Z" fill="currentColor"/>
                </svg>
                <p className="text-white mb-6 leading-relaxed">{testimonial.quote}</p>
                <div>
                  <div className="font-bold text-white">{testimonial.author}</div>
                  <div className="text-white/60">{testimonial.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Pricing Section */}
      <div id="pricing" className="py-24 bg-black relative">
        {/* Background gradient effects */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute bottom-40 left-0 w-[600px] h-[600px] bg-indigo-500 opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-purple-500 opacity-10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
              Simple, transparent pricing
            </h2>
            <p className="text-white/70">
              No hidden fees. No surprises. Choose the plan that's right for you.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Starter",
                price: "$29",
                description: "Perfect for individuals and small projects",
                features: [
                  "5 projects",
                  "Basic analytics",
                  "1GB storage",
                  "Community support",
                  "48-hour response time"
                ]
              },
              {
                name: "Pro",
                price: "$79",
                description: "Ideal for growing businesses",
                features: [
                  "Unlimited projects",
                  "Advanced analytics",
                  "10GB storage",
                  "Priority support",
                  "24-hour response time",
                  "API access"
                ],
                highlighted: true
              },
              {
                name: "Enterprise",
                price: "$249",
                description: "For large-scale operations",
                features: [
                  "Unlimited everything",
                  "Custom analytics",
                  "100GB storage",
                  "Dedicated support",
                  "1-hour response time",
                  "API access",
                  "Custom integrations"
                ]
              }
            ].map((plan, i) => (
              <div 
                key={i} 
                className={cn(
                  "rounded-2xl p-8 border shadow-xl backdrop-blur-sm transition-all duration-300 hover:translate-y-[-5px]",
                  plan.highlighted 
                    ? "border-indigo-500 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 relative" 
                    : "border-white/10 bg-white/5"
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs font-bold uppercase py-1 px-3 rounded-full">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-bold mb-2 text-white">{plan.name}</h3>
                <div className="flex items-baseline">
                  <span className="text-4xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/50 ml-2">/month</span>
                </div>
                <p className="text-white/70 mt-2 mb-6">{plan.description}</p>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start">
                      <Check className="h-5 w-5 text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                      <span className="text-white/80">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Link href="/auth">
                  <Button 
                    className={cn(
                      "w-full", 
                      plan.highlighted 
                        ? "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white" 
                        : "bg-white text-black hover:bg-white/90"
                    )}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA Section */}
      <div className="relative py-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600"></div>
        
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-400 opacity-20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-400 opacity-20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">
            Ready to get started?
          </h2>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">
            Join thousands of satisfied customers who are already using FourByte to build amazing digital experiences.
          </p>
          <Link href="/auth">
            <Button size="lg" className="bg-white text-black hover:bg-white/90 px-8 shadow-lg">
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gradient-to-t from-black to-black/90 border-t border-white/10 pt-20 pb-12 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden opacity-10">
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-16">
            <div className="col-span-2">
              <span className="text-2xl font-bold block mb-4 text-white">FourByte</span>
              <p className="text-white/60 mb-6 text-lg">
                Building the future of digital experiences, one pixel at a time.
              </p>
              <div className="flex space-x-4">
                {['Twitter', 'LinkedIn', 'Github', 'Facebook'].map((social) => (
                  <a 
                    key={social} 
                    href="#" 
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-white/20 hover:text-white transition-all duration-200 transform hover:scale-110"
                  >
                    {social[0]}
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-white">Product</h3>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Docs', 'Changelog'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-white/60 hover:text-white transition-colors duration-200">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-white">Company</h3>
              <ul className="space-y-3">
                {['About', 'Blog', 'Careers', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-white/60 hover:text-white transition-colors duration-200">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-4 text-white">Legal</h3>
              <ul className="space-y-3">
                {['Privacy', 'Terms', 'Security', 'Cookies'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-white/60 hover:text-white transition-colors duration-200">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/60 mb-4 md:mb-0">
              © 2025 FourByte. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-white/60 hover:text-white text-sm">
                Privacy Policy
              </a>
              <a href="#" className="text-white/60 hover:text-white text-sm">
                Terms of Service
              </a>
              <a href="#" className="text-white/60 hover:text-white text-sm">
                Cookie Settings
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}