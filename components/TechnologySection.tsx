import React from 'react';
import { Edit3, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { doc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";

interface Product {
  id: string;
  name: string;
  description?: string;
  image?: string;
  media?: { url: string; type: string }[];
  company_id: string;
  slug?: string;
  [key: string]: any;
}

interface CompanyData {
  web_config?: {
    ourTechnology?: {
      mainTitle: string;
      subtitle: string;
      products?: Product[];
    };
  };
}

interface TechnologySectionProps {
  companyData: CompanyData | null;
  slug: string;
  EditableElement: React.ComponentType<any>;
}

const TechnologySection: React.FC<TechnologySectionProps> = ({ companyData, slug, EditableElement }) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [currentTechConfig, setCurrentTechConfig] = React.useState<{
    mainTitle: string;
    subtitle: string;
    products: Product[];
  }>({
    mainTitle: "Our Technology, Your Way",
    subtitle: "Digital Products for Any Space, Any Application",
    products: [],
  });
  const [saving, setSaving] = React.useState(false);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = React.useState(false);

  const fetchCompanyProducts = async (companyId: string) => {
    try {
      setProductsLoading(true);
      console.log("[TechnologySection] Fetching products for company ID:", companyId);

      const productsRef = collection(db, "products");
      const productsQuery = query(productsRef, where("company_id", "==", companyId));
      const productsSnapshot = await getDocs(productsQuery);

      const companyProducts = productsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        slug:
          doc.data().slug ||
          doc
            .data()
            .name?.toLowerCase()
            .replace(/\s+/g, "-")
            .replace(/[^a-z0-9-]/g, ""),
        description: doc.data().description || `Professional ${doc.data().name} solution`,
        features: doc.data().features || doc.data().key_features || [],
      })) as Product[];

      console.log("[TechnologySection] Fetched products:", companyProducts);
      setProducts(companyProducts);

      if (companyProducts.length === 0) {
        console.log("[TechnologySection] No products found for company");
      }
    } catch (error) {
      console.error("[TechnologySection] Error fetching company products:", error);
      toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProductsLoading(false);
    }
  };

  React.useEffect(() => {
    if (slug) {
      fetchCompanyProducts(slug);
    }
  }, [slug]);

  const handleEditClick = () => {
    setCurrentTechConfig(companyData?.web_config?.ourTechnology ? {
      mainTitle: companyData.web_config.ourTechnology.mainTitle,
      subtitle: companyData.web_config.ourTechnology.subtitle,
      products: [], // Products are not editable
    } : {
      mainTitle: "Our Technology, Your Way",
      subtitle: "Digital Products for Any Space, Any Application",
      products: [],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!slug) return;
    setSaving(true);
    try {
      const docRef = doc(db, "companies", slug);
      await updateDoc(docRef, {
        "web_config.ourTechnology.mainTitle": currentTechConfig.mainTitle,
        "web_config.ourTechnology.subtitle": currentTechConfig.subtitle,
      });
      toast({ title: "Success", description: "Technology section updated." });
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving technology section:", error);
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const mainTitleToDisplay = companyData?.web_config?.ourTechnology?.mainTitle || currentTechConfig.mainTitle;
  const subtitleToDisplay = companyData?.web_config?.ourTechnology?.subtitle || currentTechConfig.subtitle;

  return (
    <section id="our-technology" className="py-16 bg-gray-50">
      <div
        className="container mx-auto px-4 text-center relative group cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 rounded-lg p-4 transition-all"
        onClick={handleEditClick}
      >
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Edit Technology Section
          </div>
        </div>

        <EditableElement
          content={{
            type: "heading",
            content: mainTitleToDisplay,
            section: "ourTechnology",
            field: "mainTitle",
          }}
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">{mainTitleToDisplay}</h2>
        </EditableElement>
        <EditableElement
          content={{
            type: "description",
            content: subtitleToDisplay,
            section: "ourTechnology",
            field: "subtitle",
          }}
        >
          <p className="text-xl text-gray-600 mb-12">{subtitleToDisplay}</p>
        </EditableElement>

        {/* Products are now fetched and displayed */}
        {productsLoading ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading products...</span>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {products.map((product) => (
              <div key={product.id} className="relative aspect-square bg-white rounded-lg shadow-md overflow-hidden group">
                <div className="absolute inset-0">
                  {product.media?.[0]?.url ? (
                    <img
                      src={product.media[0].url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">{product.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex items-end p-4 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm opacity-80 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[200px] text-center text-gray-500">
            <p>No products found for this section.</p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Our Technology Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mainTitle">Main Title</Label>
              <Input
                id="mainTitle"
                value={currentTechConfig.mainTitle}
                onChange={(e) => setCurrentTechConfig(prev => ({ ...prev, mainTitle: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={currentTechConfig.subtitle}
                onChange={(e) => setCurrentTechConfig(prev => ({ ...prev, subtitle: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default TechnologySection;