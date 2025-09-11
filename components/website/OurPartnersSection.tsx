import React from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import "../../styles/carousel.css"; // Import the CSS for carousel animation

interface Partner {
  id: number;
  name: string;
  logo: string;
}

interface CompanyData {
  web_config?: {
    ourPartners?: {
      sectionTitle?: string;
      subtitle?: string;
      backgroundColor?: string;
      textColor?: string;
      carouselSpeed?: number; // Added carouselSpeed
      partners?: Partner[];
    };
  };
}

interface OurPartnersSectionProps {
  companyData: CompanyData | null;
  slug: string;
  EditableElement: React.ComponentType<any>;
}

const OurPartnersSection: React.FC<OurPartnersSectionProps> = ({ companyData, slug, EditableElement }) => {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [currentPartnersConfig, setCurrentPartnersConfig] = React.useState<{
    sectionTitle: string;
    subtitle: string;
    backgroundColor: string;
    textColor: string;
    carouselSpeed: number; // Added carouselSpeed
    partners: Partner[];
  }>({
    sectionTitle: "Our Partners",
    subtitle: "trusted by local and global brands across the philippines",
    backgroundColor: "#5a32b4", // A shade of purple from the image
    textColor: "#ffffff",
    carouselSpeed: 30, // Default speed in seconds
    partners: [
      { id: 1, name: "National Book Store", logo: "/images/partners/national-book-store.png" },
      { id: 2, name: "Vans", logo: "/images/partners/vans.png" },
      { id: 3, name: "Puma", logo: "/images/partners/puma.png" },
      { id: 4, name: "Calvin Klein", logo: "/images/partners/calvin-klein.png" },
      { id: 5, name: "Bottega Veneta", logo: "/images/partners/bottega-veneta.png" },
      { id: 6, name: "Lacoste", logo: "/images/partners/lacoste.png" },
      { id: 7, name: "Kanebo", logo: "/images/partners/kanebo.png" },
      { id: 8, name: "Straightforward", logo: "/images/partners/straightforward.png" },
    ],
  });
  const [uploadingImageId, setUploadingImageId] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (companyData?.web_config?.ourPartners) {
      setCurrentPartnersConfig({
        sectionTitle: companyData.web_config.ourPartners.sectionTitle || "Our Partners",
        subtitle: companyData.web_config.ourPartners.subtitle || "trusted by local and global brands across the philippines",
        backgroundColor: companyData.web_config.ourPartners.backgroundColor || "#5a32b4",
        textColor: companyData.web_config.ourPartners.textColor || "#ffffff",
        carouselSpeed: companyData.web_config.ourPartners.carouselSpeed || 30, // Added carouselSpeed
        partners: companyData.web_config.ourPartners.partners || [],
      });
    }
  }, [companyData]);

  const handleEditClick = () => {
    setCurrentPartnersConfig(companyData?.web_config?.ourPartners ? {
      sectionTitle: companyData.web_config.ourPartners.sectionTitle || "Our Partners",
      subtitle: companyData.web_config.ourPartners.subtitle || "trusted by local and global brands across the philippines",
      backgroundColor: companyData.web_config.ourPartners.backgroundColor || "#5a32b4",
      textColor: companyData.web_config.ourPartners.textColor || "#ffffff",
      carouselSpeed: companyData.web_config.ourPartners.carouselSpeed || 30, // Added carouselSpeed
      partners: companyData.web_config.ourPartners.partners || [],
    } : {
      sectionTitle: "Our Partners",
      subtitle: "trusted by local and global brands across the philippines",
      backgroundColor: "#5a32b4",
      textColor: "#ffffff",
      carouselSpeed: 30, // Default speed in seconds
      partners: [
        { id: 1, name: "National Book Store", logo: "/images/partners/national-book-store.png" },
        { id: 2, name: "Vans", logo: "/images/partners/vans.png" },
        { id: 3, name: "Puma", logo: "/images/partners/puma.png" },
        { id: 4, name: "Calvin Klein", logo: "/images/partners/calvin-klein.png" },
        { id: 5, name: "Bottega Veneta", logo: "/images/partners/bottega-veneta.png" },
        { id: 6, name: "Lacoste", logo: "/images/partners/lacoste.png" },
        { id: 7, name: "Kanebo", logo: "/images/partners/kanebo.png" },
        { id: 8, name: "Straightforward", logo: "/images/partners/straightforward.png" },
      ],
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!slug) return;
    setSaving(true);
    try {
      const docRef = doc(db, "companies", slug);
      await updateDoc(docRef, {
        "web_config.ourPartners": currentPartnersConfig,
      });
      toast({ title: "Success", description: "Our Partners section updated." });
      setDialogOpen(false);
    } catch (error) {
      console.error("Error saving Our Partners section:", error);
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const addPartner = () => {
    setCurrentPartnersConfig(prev => ({
      ...prev,
      partners: [...prev.partners, { id: Date.now(), name: "New Partner", logo: "/placeholder.svg" }]
    }));
  };

  const removePartner = (id: number) => {
    setCurrentPartnersConfig(prev => ({
      ...prev,
      partners: prev.partners.filter(partner => partner.id !== id)
    }));
  };

  const updatePartner = (id: number, field: keyof Partner, value: string) => {
    setCurrentPartnersConfig(prev => ({
      ...prev,
      partners: prev.partners.map(partner =>
        partner.id === id ? { ...partner, [field]: value } : partner
      )
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, id: number) => {
    const file = e.target.files?.[0];
    if (!file || !slug) return;

    setUploadingImageId(id);
    try {
      const filePath = `companies/${slug}/partners/${file.name}`;
      const imageRef = ref(storage, filePath);
      await uploadBytes(imageRef, file);
      const imageUrl = await getDownloadURL(imageRef);
      updatePartner(id, "logo", imageUrl);
      toast({ title: "Success", description: "Logo uploaded." });
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({ title: "Error", description: "Failed to upload logo.", variant: "destructive" });
    } finally {
      setUploadingImageId(null);
    }
  };

  const partnersToDisplay = companyData?.web_config?.ourPartners?.partners || currentPartnersConfig.partners;
  const sectionTitleToDisplay = companyData?.web_config?.ourPartners?.sectionTitle || currentPartnersConfig.sectionTitle;
  const subtitleToDisplay = companyData?.web_config?.ourPartners?.subtitle || currentPartnersConfig.subtitle;
  const backgroundColorToDisplay = companyData?.web_config?.ourPartners?.backgroundColor || currentPartnersConfig.backgroundColor;
  const textColorToDisplay = companyData?.web_config?.ourPartners?.textColor || currentPartnersConfig.textColor;
  const carouselSpeedToDisplay = companyData?.web_config?.ourPartners?.carouselSpeed || currentPartnersConfig.carouselSpeed;

  return (
    <section id="our-partners" className="py-16" style={{ backgroundColor: backgroundColorToDisplay, color: textColorToDisplay }}>
      <div
        className="container mx-auto px-4 relative group cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50 rounded-lg p-4 transition-all"
        onClick={handleEditClick}
      >
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
            <Edit3 className="w-4 h-4" />
            Edit Our Partners Section
          </div>
        </div>

        <div className="text-center mb-12">
          <EditableElement
            content={{
              type: "heading",
              content: sectionTitleToDisplay,
              section: "ourPartners",
              field: "sectionTitle",
            }}
          >
            <h2 className="text-4xl font-bold mb-4">{sectionTitleToDisplay}</h2>
          </EditableElement>
          <EditableElement
            content={{
              type: "description",
              content: subtitleToDisplay,
              section: "ourPartners",
              field: "subtitle",
            }}
          >
            <p className="text-xl">{subtitleToDisplay}</p>
          </EditableElement>
        </div>

        <div className="overflow-hidden whitespace-nowrap py-4">
          <div className="logo-carousel inline-block" style={{ animationDuration: `${carouselSpeedToDisplay}s` }}>
            {partnersToDisplay.concat(partnersToDisplay).map((partner: Partner, index: number) => (
              <div key={index} className="inline-block mx-8">
                <EditableElement
                  content={{
                    type: "image",
                    content: partner.logo,
                    section: "ourPartners",
                    field: `partner_${partner.id}_logo`,
                  }}
                >
                  <img src={partner.logo} alt={partner.name} className="h-24 w-auto object-contain filter grayscale brightness-0 invert" />
                </EditableElement>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Our Partners Section</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="sectionTitle">Section Title</Label>
              <Input
                id="sectionTitle"
                value={currentPartnersConfig.sectionTitle}
                onChange={(e) => setCurrentPartnersConfig(prev => ({ ...prev, sectionTitle: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input
                id="subtitle"
                value={currentPartnersConfig.subtitle}
                onChange={(e) => setCurrentPartnersConfig(prev => ({ ...prev, subtitle: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="backgroundColor">Background Color</Label>
              <Input
                id="backgroundColor"
                type="color"
                value={currentPartnersConfig.backgroundColor}
                onChange={(e) => setCurrentPartnersConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="textColor">Text Color</Label>
              <Input
                id="textColor"
                type="color"
                value={currentPartnersConfig.textColor}
                onChange={(e) => setCurrentPartnersConfig(prev => ({ ...prev, textColor: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="carouselSpeed">Carousel Speed (seconds)</Label>
              <Input
                id="carouselSpeed"
                type="number"
                value={currentPartnersConfig.carouselSpeed}
                onChange={(e) => setCurrentPartnersConfig(prev => ({ ...prev, carouselSpeed: Number(e.target.value) }))}
                min="1"
              />
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">Partners</h4>
              {currentPartnersConfig.partners.map((partner) => (
                <div key={partner.id} className="flex items-center gap-3 p-2 border rounded-md">
                  <Input
                    value={partner.name}
                    onChange={(e) => updatePartner(partner.id, "name", e.target.value)}
                    placeholder="Partner Name"
                  />
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, partner.id)}
                    className="flex-1"
                  />
                  {uploadingImageId === partner.id && (
                    <span className="text-sm text-gray-500">Uploading...</span>
                  )}
                  {partner.logo && (
                    <img src={partner.logo} alt={partner.name} className="w-10 h-10 object-contain rounded" />
                  )}
                  <Button variant="outline" size="sm" onClick={() => removePartner(partner.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" onClick={addPartner} className="w-full">
                <Plus className="w-4 h-4 mr-2" /> Add Partner
              </Button>
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

export default OurPartnersSection;