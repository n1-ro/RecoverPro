import React from 'react';
import { Navigate } from 'react-router-dom';
import { Headphones, Building2, Shield, CheckCircle2, Notebook as Robot, XCircle, TrendingUp, RefreshCw, Calendar, Users, Zap, Star, ArrowRight, PlayCircle, Globe, Award, Target, Sparkles, BarChart3, DollarSign, Briefcase, Network } from 'lucide-react';
import { Modal } from '../components/Modal';
import { Auth } from '../components/Auth';
import { useAuth } from '../hooks/useAuth';

interface HomeProps {
  onApplyClick?: () => void;
}

export function Home({ onApplyClick }: HomeProps) {
  const { user, loading } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);

  const handleApplyClick = () => {
    if (onApplyClick) {
      onApplyClick();
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleAuthSuccess = () => setIsAuthModalOpen(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400"></div>
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-400 opacity-20"></div>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-indigo-500/10 to-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32">
          <div className="max-w-7xl mx-auto px-4 text-center">
            {/* Main Headline */}
            <div className="mb-12">
              <h1 className="text-6xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
                Top Collectors.
                <br />
                <span className="text-5xl md:text-6xl bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                  Top Pay.
                </span>
              </h1>
              
              <p className="text-2xl md:text-3xl font-semibold mb-8 text-gray-200 leading-relaxed">
                The Fastest Growing{" "}
                <span className="relative inline-block mx-2">
                  <span className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-2 rounded-lg font-bold shadow-lg">
                    WORK FROM HOME
                  </span>
                </span>
                Debt Collection Staffing Company
              </p>
            </div>
          
            {/* Mission Statement */}
            <div className="mb-12">
              <div className="max-w-5xl mx-auto">
                <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 border border-white/20 shadow-2xl">
                  <div className="flex items-center justify-center mb-6">
                    <Sparkles className="w-6 h-6 text-blue-400 mr-2" />
                    <h2 className="text-2xl font-bold text-white">Our Mission</h2>
                    <Sparkles className="w-6 h-6 text-indigo-400 ml-2" />
                  </div>
                  <p className="text-xl text-gray-200 leading-relaxed">
                    We're revolutionizing debt collection by empowering our collectors with{" "}
                    <span className="font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                      cutting-edge technology and industry expertise
                    </span>. 
                    Our platform provides hundreds of APIs and advanced tools because we believe{" "}
                    <span className="font-semibold text-white">
                      technology should serve the collector, not replace them
                    </span>. 
                    This powerful combination makes us the industry's most effective agency.
                  </p>
                </div>
              </div>
            </div>
            
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-10">
              Join our elite team of remote debt collection professionals. Work from home while making a real impact.
            </p>
            
            {/* CTA Button */}
            <div className="mb-12">
              <button
                onClick={handleApplyClick}
                className="group relative px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold text-lg rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
              >
                <div className="relative flex items-center space-x-2">
                  <span>Apply Now</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </button>
            </div>

            {/* Feature Pills */}
            <div className="flex justify-center gap-6">
              {[
                { icon: CheckCircle2, text: "Flexible Hours" },
                { icon: Zap, text: "Full Training" },
                { icon: TrendingUp, text: "Competitive Pay" }
              ].map((item, index) => (
                <div key={index} className="group">
                  <div className="flex items-center space-x-3 px-6 py-3 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 hover:bg-white/20 transition-all duration-300">
                    <item.icon className="w-5 h-5 text-blue-400" />
                    <span className="text-white font-medium">{item.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Platform & Commission Section */}
        <section className="max-w-7xl mx-auto mb-24 px-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
            <div className="p-12">
              <div className="text-center mb-12">
                <h2 className="text-5xl font-bold text-white mb-6">
                  The <span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Professional Platform</span> for Debt Collection
                </h2>
                <p className="text-xl text-gray-200 max-w-5xl mx-auto">
                  We're not just another collection agency. We're a revolutionary platform that puts <strong className="text-white">you</strong> in control 
                  with the highest commission rates in the industry, powered by cutting-edge technology.
                </p>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
                {[
                  {
                    title: "Industry-Leading Commissions",
                    icon: DollarSign,
                    gradient: "from-green-500 to-emerald-600",
                    items: [
                      { text: "Up to 50% profit sharing on account collections", highlight: true },
                      { text: "Portfolio investment opportunities for higher returns", highlight: true },
                      { text: "Residual income for life from payment plan commissions", highlight: true },
                      { text: "ClearPay247 affiliate program for additional revenue", highlight: true }
                    ]
                  },
                  {
                    title: "Advanced Technology",
                    icon: Zap,
                    gradient: "from-blue-500 to-indigo-600",
                    items: [
                      { text: "Smart placement matching using advanced algorithms", highlight: true },
                      { text: "Hundreds of APIs for maximum efficiency", highlight: true },
                      { text: "Agent-focused software designed to serve you", highlight: true },
                      { text: "20+ years of industry expertise built into every tool", highlight: true }
                    ]
                  }
                ].map((section, index) => (
                  <div key={index} className="group">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                      <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                        <div className={`bg-gradient-to-r ${section.gradient} rounded-full p-3 mr-4`}>
                          <section.icon className="w-6 h-6 text-white" />
                        </div>
                        {section.title}
                      </h3>
                      <ul className="space-y-4">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle2 className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300">
                              {item.highlight ? (
                                <strong className="text-white">{item.text}</strong>
                              ) : (
                                item.text
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Role Cards */}
              <div className="bg-gradient-to-r from-blue-600/20 to-indigo-600/20 backdrop-blur-sm rounded-2xl p-8 border border-white/20 mb-12">
                <h3 className="text-3xl font-bold text-white mb-8 text-center">You're Not Just a Collector</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                    {
                      icon: BarChart3,
                      title: "Sales Professional",
                      description: "Build relationships and close deals with proven sales techniques",
                      gradient: "from-blue-400 to-cyan-400"
                    },
                    {
                      icon: Briefcase,
                      title: "Business Owner",
                      description: "Take ownership with profit-sharing and portfolio investments",
                      gradient: "from-indigo-400 to-purple-400"
                    },
                    {
                      icon: Headphones,
                      title: "Financial Advisor",
                      description: "Help people resolve debt through payment plans and settlements",
                      gradient: "from-green-400 to-emerald-400"
                    }
                  ].map((role, index) => (
                    <div key={index} className="text-center group">
                      <div className={`bg-gradient-to-r ${role.gradient} rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center shadow-lg`}>
                        <role.icon className="w-8 h-8 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-white mb-3">{role.title}</h4>
                      <p className="text-gray-300 leading-relaxed">{role.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {[
                  {
                    title: "Legitimate Debt Only",
                    description: "Work exclusively with reputable companies and verified debt portfolios through our rigorous vetting process.",
                    icon: Shield
                  },
                  {
                    title: "Professional Community",
                    description: "Join a community of professionals with shared resources, training, and peer support networks.",
                    icon: Users
                  },
                  {
                    title: "Technology Integration",
                    description: "Access our creditor-consumer communication portal to help clients with all their accounts.",
                    icon: Network
                  },
                  {
                    title: "Industry Leadership",
                    description: "Be part of shaping the future of debt collection through our innovative platform approach.",
                    icon: Award
                  }
                ].map((feature, index) => (
                  <div key={index} className="group">
                    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all duration-300">
                      <div className="flex items-center mb-3">
                        <feature.icon className="w-5 h-5 text-blue-400 mr-3" />
                        <h4 className="font-bold text-white">{feature.title}</h4>
                      </div>
                      <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Final CTA */}
              <div className="text-center">
                <div className="max-w-3xl mx-auto mb-8">
                  <div className="bg-gradient-to-r from-blue-500/20 to-indigo-500/20 backdrop-blur-sm border border-blue-300/30 rounded-2xl p-6">
                    <p className="text-lg font-bold text-blue-300 mb-2">
                      Ready to Transform Your Career?
                    </p>
                    <p className="text-blue-200">
                      If you're a dedicated professional who wants to excel at debt collection while building residual income for life, 
                      this is your opportunity to leverage two decades of industry expertise in a revolutionary new way.
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleApplyClick}
                  className="group relative px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold text-xl rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25"
                >
                  <div className="relative flex items-center space-x-3">
                    <span>Join Our Platform</span>
                    <PlayCircle className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Residual Income Section */}
        <section className="max-w-7xl mx-auto mb-24 px-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
            <div className="p-12">
              <div className="flex items-center justify-center mb-8">
                <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-6">
                  <TrendingUp className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h2 className="text-4xl font-bold text-white mb-6 text-center">
                Build Your Business &
                <span className="block bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  Residual Income
                </span>
              </h2>
              
              <p className="text-xl text-gray-200 max-w-4xl mx-auto mb-12 text-center leading-relaxed">
                Unlike traditional jobs with fixed income, debt collection offers unlimited earning potential. 
                Every payment plan you establish becomes part of your growing portfolio, generating 
                continuous commissions with each payment.
              </p>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {[
                  {
                    icon: Users,
                    title: "Client Relationships",
                    description: "Build rapport with customers on payment plans who recognize you as their dedicated account manager.",
                    gradient: "from-blue-400 to-cyan-400"
                  },
                  {
                    icon: Calendar,
                    title: "Predictable Income",
                    description: "Commission checks grow month after month as your portfolio of payment plans increases.",
                    gradient: "from-indigo-400 to-purple-400"
                  },
                  {
                    icon: RefreshCw,
                    title: "Compounding Growth",
                    description: "Each new customer adds to your income stream without proportionally increasing your workload.",
                    gradient: "from-green-400 to-emerald-400"
                  }
                ].map((item, index) => (
                  <div key={index} className="group">
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300">
                      <div className={`bg-gradient-to-r ${item.gradient} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                        <item.icon className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-4 text-center">{item.title}</h3>
                      <p className="text-gray-300 text-center leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Testimonial */}
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                  <div className="flex items-center justify-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-xl font-semibold text-green-300 mb-4 text-center italic">
                    "My monthly income has more than doubled after building a strong portfolio of payment plans. The best part is that I'm still earning commissions from customers I helped months ago."
                  </p>
                  <p className="text-gray-400 text-center">
                    — Sarah K., Top Collector (2+ years)
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <button
                  onClick={handleApplyClick}
                  className="group relative px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-700 text-white font-bold text-lg rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-green-500/25"
                >
                  <div className="relative flex items-center space-x-2">
                    <span>Start Building Your Portfolio</span>
                    <TrendingUp className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* AI-Proof Career Section */}
        <section className="max-w-7xl mx-auto mb-24 px-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
            <div className="p-12">
              <div className="flex items-center justify-center mb-8">
                <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-full p-6">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              </div>
              
              <h2 className="text-4xl font-bold text-white mb-8 text-center">
                A Human-Only Profession
                <span className="block bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Protected By Law
                </span>
              </h2>
              
              <div className="text-xl text-gray-200 max-w-4xl mx-auto mb-12 text-center space-y-4">
                <p>
                  Unlike many industries facing AI replacement, <strong className="text-orange-300">debt collection is legally protected</strong>. The Telephone Consumer Protection Act (TCPA) explicitly prohibits using AI systems for outbound collection calls.
                </p>
                <p>
                  This means your career as a debt collector cannot be automated or outsourced to artificial intelligence. While other industries worry about AI taking over, debt collection remains a secure career path with guaranteed human demand.
                </p>
              </div>
              
              <div className="flex items-center justify-center space-x-16 mb-12">
                {[
                  {
                    title: "What AI Cannot Do",
                    icon: XCircle,
                    items: [
                      "Make outbound debt collection calls",
                      "Negotiate payment arrangements",
                      "Handle sensitive financial conversations"
                    ],
                    color: "red",
                    bgColor: "from-red-500/20 to-orange-500/20"
                  },
                  {
                    title: "What You Bring",
                    icon: CheckCircle2,
                    items: [
                      "Human empathy and understanding",
                      "Personalized negotiation skills",
                      "Compliance with TCPA regulations"
                    ],
                    color: "emerald",
                    bgColor: "from-emerald-500/20 to-green-500/20"
                  }
                ].map((section, index) => (
                  <div key={index} className="max-w-xs">
                    <div className={`bg-gradient-to-br ${section.bgColor} backdrop-blur-sm rounded-2xl p-6 border border-white/20`}>
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-${section.color}-500 text-white mb-4`}>
                        <section.icon className="w-8 h-8" />
                      </div>
                      <h3 className="font-bold text-white mb-4 text-lg">{section.title}</h3>
                      <ul className="space-y-3">
                        {section.items.map((item, i) => (
                          <li key={i} className="flex items-start text-sm text-gray-300">
                            <section.icon className={`w-4 h-4 ${section.color === 'red' ? 'text-red-400' : 'text-emerald-400'} mr-2 mt-0.5 flex-shrink-0`} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center">
                <button
                  onClick={handleApplyClick}
                  className="group relative px-10 py-4 bg-gradient-to-r from-orange-600 to-red-700 text-white font-bold text-lg rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-orange-500/25"
                >
                  <div className="relative flex items-center space-x-2">
                    <span>Start Your Secure Career</span>
                    <Shield className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </section>
        
        {/* Feature Cards */}
        <section className="max-w-7xl mx-auto mb-24 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Building2,
                title: "Professional Environment",
                description: "Create your ideal work environment at home with our flexible remote setup",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Shield,
                title: "Compliance First",
                description: "Stay ahead with our comprehensive compliance training and certification program",
                gradient: "from-green-500 to-emerald-500"
              },
              {
                icon: Headphones,
                title: "Advanced Tools",
                description: "Access cutting-edge collection software and communication tools",
                gradient: "from-indigo-500 to-purple-500"
              }
            ].map((feature, index) => (
              <div key={index} className="group">
                <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105">
                  <div className={`bg-gradient-to-r ${feature.gradient} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4 text-center">{feature.title}</h3>
                  <p className="text-gray-300 text-center leading-relaxed">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Final CTA Section */}
        <section className="max-w-5xl mx-auto text-center mb-24 px-4">
          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-12 border border-white/10">
            <h2 className="text-4xl font-bold text-white mb-6">
              Start Your Professional Career
              <span className="block bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Today
              </span>
            </h2>
            <p className="text-xl text-gray-200 mb-10 leading-relaxed">
              Complete our professional assessment below to demonstrate your communication skills and begin your journey with us.
            </p>
            <button
              onClick={handleApplyClick}
              className="group relative px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold text-xl rounded-xl shadow-2xl transform transition-all duration-300 hover:scale-105 hover:shadow-blue-500/25"
            >
              <div className="relative flex items-center space-x-3">
                <Target className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                <span>Start Assessment Now</span>
                <Target className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
              </div>
            </button>
          </div>
        </section>

        <Modal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)}>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Applicant Login
            </h2>
            <Auth onSuccess={handleAuthSuccess} />
          </div>
        </Modal>
      </div>
    </div>
  );
}