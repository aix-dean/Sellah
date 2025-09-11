import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Link from 'next/link';
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
}

interface GetQuotationSectionProps {
  slug: string;
  websiteId: string;
  isEditing: boolean;
}

const GetQuotationSection: React.FC<GetQuotationSectionProps> = ({
  slug,
  isEditing,
}) => {
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [mobilePhone, setMobilePhone] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [productsOfInterest, setProductsOfInterest] = useState('');
  const [preferredSize, setPreferredSize] = useState('');
  const [location, setLocation] = useState<string[]>([]);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      if (!slug) return;
      try {
        const productsRef = collection(db, "products");
        const productsQuery = query(productsRef, where("company_id", "==", slug));
        const productsSnapshot = await getDocs(productsQuery);
        const fetchedProducts = productsSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name,
        })) as Product[];
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Error fetching products for quotation section:", error);
        toast({
          title: "Error",
          description: "Failed to load products for quotation. Please try again.",
          variant: "destructive",
        });
      }
    };
    fetchProducts();
  }, [slug, toast]);

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      // Here you would typically send this data to an API endpoint
      // For now, we'll just log it to the console.
      console.log('Quotation Request Submitted:', {
        firstName,
        lastName,
        mobilePhone,
        email,
        companyName,
        productsOfInterest,
        preferredSize,
        location,
        additionalInfo,
      });
      toast({
        title: "Success",
        description: "Your quotation request has been submitted!",
      });
      // Reset form fields
      setFirstName('');
      setLastName('');
      setMobilePhone('');
      setEmail('');
      setCompanyName('');
      setProductsOfInterest('');
      setPreferredSize('');
      setLocation([]);
      setAdditionalInfo('');
    } catch (error) {
      console.error('Failed to submit quotation request:', error);
      toast({
        title: "Error",
        description: "Failed to submit quotation request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target;
    setLocation((prev) =>
      checked ? [...prev, value] : prev.filter((loc) => loc !== value)
    );
  };

  return (
    <section className="py-16 px-4 max-w-4xl mx-auto">
      <h2 className="text-4xl font-bold text-gray-800 text-center mb-8">Get Your Custom Quotation Today!</h2>
      <p className="text-lg text-gray-600 text-center max-w-2xl mx-auto mb-12">Tell us about your needs, and we'll provide a tailored quote.</p>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name<span className="text-red-500">*</span></label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First Name"
              required
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name<span className="text-red-500">*</span></label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last Name"
              required
            />
          </div>
          <div>
            <label htmlFor="mobilePhone" className="block text-sm font-medium text-gray-700 mb-1">Mobile Phone<span className="text-red-500">*</span></label>
            <Input
              id="mobilePhone"
              value={mobilePhone}
              onChange={(e) => setMobilePhone(e.target.value)}
              placeholder="Mobile Phone"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email<span className="text-red-500">*</span></label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Company Name<span className="text-red-500">*</span></label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Company Name"
            required
          />
        </div>

        <div>
          <label htmlFor="productsOfInterest" className="block text-sm font-medium text-gray-700 mb-1">Products You're Interested In<span className="text-red-500">*</span></label>
          <select
            id="productsOfInterest"
            value={productsOfInterest}
            onChange={(e) => setProductsOfInterest(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            required
          >
            <option value="">Please select one.</option>
            {products.map((product) => (
              <option key={product.id} value={product.name}>{product.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="preferredSize" className="block text-sm font-medium text-gray-700 mb-1">Preferred Size of Display<span className="text-red-500">*</span></label>
          <Input
            id="preferredSize"
            value={preferredSize}
            onChange={(e) => setPreferredSize(e.target.value)}
            placeholder="If LED Wall, please share your desired size of display in width x height."
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Location of Installation<span className="text-red-500">*</span></label>
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                value="Indoor"
                checked={location.includes('Indoor')}
                onChange={handleLocationChange}
                className="mr-2"
              />
              Indoor
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="Outdoor"
                checked={location.includes('Outdoor')}
                onChange={handleLocationChange}
                className="mr-2"
              />
              Outdoor
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                value="Indoor + Outdoor (i.e. movable)"
                checked={location.includes('Indoor + Outdoor (i.e. movable)')}
                onChange={handleLocationChange}
                className="mr-2"
              />
              Indoor + Outdoor (i.e. movable)
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="additionalInfo" className="block text-sm font-medium text-gray-700 mb-1">Any Additional Info On Your Project?</label>
          <Textarea
            id="additionalInfo"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
            placeholder=""
            rows={4}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white text-lg px-8 py-3 rounded-md mt-6"
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </Button>

      </div>
    </section>
  );
};

export default GetQuotationSection;