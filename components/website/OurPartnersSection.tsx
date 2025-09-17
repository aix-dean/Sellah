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
  EditableElement?: React.ComponentType<any>;
}

const OurPartnersSection: React.FC<OurPartnersSectionProps> = ({ companyData, slug, EditableElement }) => {
  // Default EditableElement that just renders children
  const DefaultEditableElement: React.ComponentType<any> = ({ children, ...props }) => <>{children}</>;

  // Use provided EditableElement or default
  const ActualEditableElement = EditableElement || DefaultEditableElement;

  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [currentPartnersConfig, setCurrentPartnersConfig] = React.useState<{
    sectionTitle: string;
    subtitle: string;
    backgroundColor: string;
    textColor: string;
    carouselSpeed: number;
    partners: Partner[];
  }>({
    sectionTitle: "Our Partners",
    subtitle: "trusted by local and global brands across the philippines",
    backgroundColor: "#5a32b4",
    textColor: "#ffffff",
    carouselSpeed: 30,
    partners: [], // Start with empty array instead of defaults
  });
  const [uploadingImageId, setUploadingImageId] = React.useState<number | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [savedConfig, setSavedConfig] = React.useState<typeof currentPartnersConfig | null>(null);

  React.useEffect(() => {
    if (companyData?.web_config?.ourPartners) {
      const firebaseConfig = {
        sectionTitle: companyData.web_config.ourPartners.sectionTitle || "Our Partners",
        subtitle: companyData.web_config.ourPartners.subtitle || "trusted by local and global brands across the philippines",
        backgroundColor: companyData.web_config.ourPartners.backgroundColor || "#5a32b4",
        textColor: companyData.web_config.ourPartners.textColor || "#ffffff",
        carouselSpeed: companyData.web_config.ourPartners.carouselSpeed || 30,
        partners: companyData.web_config.ourPartners.partners || [], // Use empty array if no partners
      };
      setCurrentPartnersConfig(firebaseConfig);
      setSavedConfig(firebaseConfig); // Also update saved config
    } else {
      // Reset to empty state if no data exists
      const emptyConfig = {
        sectionTitle: "Our Partners",
        subtitle: "trusted by local and global brands across the philippines",
        backgroundColor: "#5a32b4",
        textColor: "#ffffff",
        carouselSpeed: 30,
        partners: [], // Empty array instead of defaults
      };
      setCurrentPartnersConfig(emptyConfig);
      setSavedConfig(null); // Clear saved config
    }
  }, [companyData]);

  const handleEditClick = () => {
    // Always use Firebase data if available, otherwise use empty defaults
    const existingData = companyData?.web_config?.ourPartners;
    setCurrentPartnersConfig({
      sectionTitle: existingData?.sectionTitle || "Our Partners",
      subtitle: existingData?.subtitle || "trusted by local and global brands across the philippines",
      backgroundColor: existingData?.backgroundColor || "#5a32b4",
      textColor: existingData?.textColor || "#ffffff",
      carouselSpeed: existingData?.carouselSpeed || 30,
      partners: existingData?.partners || [], // Use empty array if no partners exist
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

      // Update the saved config for immediate display
      setSavedConfig(currentPartnersConfig);

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

  // Use saved config if available, otherwise use Firebase data, otherwise use current config
  const displayConfig = savedConfig || companyData?.web_config?.ourPartners || currentPartnersConfig;
  const partnersToDisplay = displayConfig.partners || [];
  const sectionTitleToDisplay = displayConfig.sectionTitle || "Our Partners";
  const subtitleToDisplay = displayConfig.subtitle || "trusted by local and global brands across the philippines";
  const backgroundColorToDisplay = displayConfig.backgroundColor || "#5a32b4";
  const textColorToDisplay = displayConfig.textColor || "#ffffff";
  const carouselSpeedToDisplay = displayConfig.carouselSpeed || 30;


  return (
    <section id="our-partners" className="py-16" style={{ backgroundColor: backgroundColorToDisplay, color: textColorToDisplay }}>
      <div
        className={`container mx-auto px-4 relative group rounded-lg p-4 transition-all ${
          EditableElement ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-opacity-50' : ''
        }`}
        onClick={EditableElement ? handleEditClick : undefined}
      >
        {EditableElement && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity z-10">
            <div className="bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Edit Our Partners Section
            </div>
          </div>
        )}

        <div className="text-center mb-12">
          <ActualEditableElement
            content={{
              type: "heading",
              content: sectionTitleToDisplay,
              section: "ourPartners",
              field: "sectionTitle",
            }}
          >
            <h2 className="text-4xl font-bold mb-4">{sectionTitleToDisplay}</h2>
          </ActualEditableElement>
          <ActualEditableElement
            content={{
              type: "description",
              content: subtitleToDisplay,
              section: "ourPartners",
              field: "subtitle",
            }}
          >
            <p className="text-xl">{subtitleToDisplay}</p>
          </ActualEditableElement>
        </div>

        {partnersToDisplay.length > 0 ? (
          <div className="overflow-hidden whitespace-nowrap py-4">
            <div
              className="logo-carousel inline-block"
              style={{ '--carousel-speed': `${carouselSpeedToDisplay}s` } as React.CSSProperties}
            >
              {/* Repeat partners multiple times to ensure seamless loop and fill space */}
              {Array.from({ length: Math.max(partnersToDisplay.length * 4, 12) }, (_, index) => {
                const partner = partnersToDisplay[index % partnersToDisplay.length];
                return (
                  <div key={`${partner.id}-${index}`} className="inline-block mx-8">
                    <ActualEditableElement
                      content={{
                        type: "image",
                        content: partner.logo,
                        section: "ourPartners",
                        field: `partner_${partner.id}_logo`,
                      }}
                    >
                      <img
                        src={partner.logo}
                        alt={partner.name}
                        className="h-24 w-auto object-contain"
                      />
                    </ActualEditableElement>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-lg opacity-75">No partners added yet. Click edit to add partners.</p>
          </div>
        )}
      </div>

      {EditableElement && (
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
              <Label htmlFor="backgroundColor">Background Color (Hex Code)</Label>
              <div className="flex gap-2">
                <Input
                  id="backgroundColor"
                  type="text"
                  value={currentPartnersConfig.backgroundColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^#[0-9A-Fa-f]{6}$/.test(value)) {
                      setCurrentPartnersConfig(prev => ({ ...prev, backgroundColor: value }));
                    }
                  }}
                  placeholder="#5a32b4"
                  className="flex-1"
                />
                <div
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  style={{ backgroundColor: currentPartnersConfig.backgroundColor }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'color';
                    input.value = currentPartnersConfig.backgroundColor;
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      setCurrentPartnersConfig(prev => ({ ...prev, backgroundColor: target.value }));
                    };
                    input.click();
                  }}
                />
              </div>
              {currentPartnersConfig.backgroundColor && !/^#[0-9A-Fa-f]{6}$/.test(currentPartnersConfig.backgroundColor) && (
                <p className="text-sm text-red-500 mt-1">Please enter a valid hex code (e.g., #5a32b4)</p>
              )}
            </div>
            <div>
              <Label htmlFor="textColor">Text Color (Hex Code)</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="text"
                  value={currentPartnersConfig.textColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^#[0-9A-Fa-f]{6}$/.test(value)) {
                      setCurrentPartnersConfig(prev => ({ ...prev, textColor: value }));
                    }
                  }}
                  placeholder="#ffffff"
                  className="flex-1"
                />
                <div
                  className="w-10 h-10 rounded border border-gray-300 cursor-pointer"
                  style={{ backgroundColor: currentPartnersConfig.textColor }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'color';
                    input.value = currentPartnersConfig.textColor;
                    input.onchange = (e) => {
                      const target = e.target as HTMLInputElement;
                      setCurrentPartnersConfig(prev => ({ ...prev, textColor: target.value }));
                    };
                    input.click();
                  }}
                />
              </div>
              {currentPartnersConfig.textColor && !/^#[0-9A-Fa-f]{6}$/.test(currentPartnersConfig.textColor) && (
                <p className="text-sm text-red-500 mt-1">Please enter a valid hex code (e.g., #ffffff)</p>
              )}
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
                  <div className="flex-1">
                    <div
                      className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
                      onClick={() => document.getElementById(`logo-upload-${partner.id}`)?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
                      }}
                      onDragLeave={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
                        const files = e.dataTransfer.files;
                        if (files.length > 0) {
                          const fakeEvent = {
                            target: { files: [files[0]] }
                          } as any;
                          handleImageUpload(fakeEvent, partner.id);
                        }
                      }}
                    >
                      {uploadingImageId === partner.id ? (
                        <div className="flex flex-col items-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                          <span className="text-sm text-gray-600">Uploading...</span>
                        </div>
                      ) : partner.logo ? (
                        <div className="flex flex-col items-center">
                          <img
                            src={partner.logo}
                            alt={partner.name}
                            className="w-16 h-16 object-contain rounded-lg mb-2 border border-gray-200"
                          />
                          <span className="text-sm text-gray-600">Click to change logo</span>
                          <span className="text-xs text-gray-400 mt-1">or drag & drop new image</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <span className="text-sm text-gray-600">Click to upload logo</span>
                          <span className="text-xs text-gray-400 mt-1">or drag & drop image here</span>
                        </div>
                      )}
                    </div>
                    <input
                      id={`logo-upload-${partner.id}`}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, partner.id)}
                      className="hidden"
                    />
                  </div>
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
      )}
    </section>
  );
};

export default OurPartnersSection;