import React from "react";
import { Phone, Mail, MapPin, Clock, MessageCircle, Heart } from "lucide-react";

const ContactUs = () => {
  const contactInfo = [
    {
      icon: <Phone size={24} />,
      title: "Call Us",
      value: "+91 98765 43210",
      href: "tel:+919876543210",
      description: "Available 24/7 for urgent queries",
      color: "bg-green-100 text-green-600 border-green-200"
    },
    {
      icon: <Mail size={24} />,
      title: "Email Us",
      value: "support@splibrary.com",
      href: "mailto:support@splibrary.com",
      description: "We'll respond within 2 hours",
      color: "bg-blue-100 text-blue-600 border-blue-200"
    },
    {
      icon: <MapPin size={24} />,
      title: "Visit Us",
      value: "Success Point Digital Library",
      href: "https://maps.google.com",
      description: "Near Main Gate, Digital Zone Path",
      color: "bg-purple-100 text-purple-600 border-purple-200"
    }
  ];

  const workingHours = [
    { day: "Monday - Friday", time: "8:00 AM - 8:00 PM" },
    { day: "Saturday", time: "9:00 AM - 6:00 PM" },
    { day: "Sunday", time: "10:00 AM - 4:00 PM" }
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-black text-slate-800 mb-2">
          Contact Us
        </h1>
        <p className="text-slate-600 font-medium">
          We're here to help! Reach out to us anytime
        </p>
      </div>

      {/* Contact Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {contactInfo.map((contact, index) => (
          <a
            key={index}
            href={contact.href}
            className={`block p-6 rounded-2xl border-2 transition-all hover:shadow-lg hover:scale-105 ${contact.color}`}
          >
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="p-3 rounded-full bg-white/50">
                {contact.icon}
              </div>
              <div>
                <h3 className="font-black text-lg mb-1">{contact.title}</h3>
                <p className="font-bold text-sm mb-2">{contact.value}</p>
                <p className="text-xs opacity-80">{contact.description}</p>
              </div>
            </div>
          </a>
        ))}
      </div>

      {/* Working Hours */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Clock size={20} className="text-indigo-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Working Hours</h3>
        </div>
        <div className="space-y-3">
          {workingHours.map((schedule, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
              <span className="font-bold text-slate-700">{schedule.day}</span>
              <span className="font-black text-indigo-600">{schedule.time}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <a
          href="tel:+919876543210"
          className="flex items-center gap-4 p-4 bg-green-50 border-2 border-green-200 rounded-2xl hover:shadow-md transition-all"
        >
          <div className="p-3 bg-green-100 rounded-full">
            <Phone size={20} className="text-green-600" />
          </div>
          <div>
            <h4 className="font-black text-green-700">Call Now</h4>
            <p className="text-sm text-green-600">Instant support</p>
          </div>
        </a>

        <a
          href="mailto:support@splibrary.com"
          className="flex items-center gap-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-2xl hover:shadow-md transition-all"
        >
          <div className="p-3 bg-blue-100 rounded-full">
            <Mail size={20} className="text-blue-600" />
          </div>
          <div>
            <h4 className="font-black text-blue-700">Send Email</h4>
            <p className="text-sm text-blue-600">Detailed queries</p>
          </div>
        </a>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 border border-indigo-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <MessageCircle size={20} className="text-indigo-600" />
          </div>
          <h3 className="text-xl font-black text-slate-800">Need Help?</h3>
        </div>
        <div className="space-y-3 text-sm">
          <p className="text-slate-600">
            <span className="font-bold">Library Issues:</span> Seat booking, payment queries, book requests
          </p>
          <p className="text-slate-600">
            <span className="font-bold">Technical Support:</span> Login problems, app issues, password reset
          </p>
          <p className="text-slate-600">
            <span className="font-bold">General Queries:</span> Timings, facilities, membership plans
          </p>
        </div>
      </div>

      {/* Footer Message */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <span className="text-sm font-medium">Made with</span>
          <Heart size={16} className="text-red-500 animate-pulse" />
          <span className="text-sm font-medium">for our students</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          Success Point Digital Library - Your Success, Our Priority
        </p>
      </div>
    </div>
  );
};

export default ContactUs;