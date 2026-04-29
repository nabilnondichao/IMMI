import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
  propertyName?: string;
  unitName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showText?: boolean;
}

export function WhatsAppButton({
  phoneNumber,
  message,
  propertyName,
  unitName,
  variant = 'default',
  size = 'default',
  className = '',
  showText = true,
}: WhatsAppButtonProps) {
  // Format phone number (remove spaces, add country code if needed)
  const formatPhoneNumber = (phone: string): string => {
    let cleaned = phone.replace(/\s+/g, '').replace(/[^0-9+]/g, '');
    // Add Benin country code if not present
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.substring(2);
      } else if (cleaned.startsWith('0')) {
        cleaned = '+229' + cleaned.substring(1);
      } else {
        cleaned = '+229' + cleaned;
      }
    }
    return cleaned;
  };

  // Generate default message
  const generateMessage = (): string => {
    if (message) return message;
    
    let defaultMessage = 'Bonjour, je vous contacte via ImmoAfrik.';
    if (propertyName) {
      defaultMessage = `Bonjour, je suis intéressé(e) par votre propriété "${propertyName}"`;
      if (unitName) {
        defaultMessage += ` - ${unitName}`;
      }
      defaultMessage += '. Pouvez-vous me donner plus d\'informations ?';
    }
    return defaultMessage;
  };

  const handleClick = () => {
    const formattedPhone = formatPhoneNumber(phoneNumber);
    const encodedMessage = encodeURIComponent(generateMessage());
    const whatsappUrl = `https://wa.me/${formattedPhone.replace('+', '')}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Button
      onClick={handleClick}
      variant={variant}
      size={size}
      className={`bg-[#25D366] hover:bg-[#128C7E] text-white ${className}`}
    >
      <MessageCircle className="h-5 w-5" />
      {showText && <span className="ml-2">WhatsApp</span>}
    </Button>
  );
}

// Floating WhatsApp button for property pages
export function FloatingWhatsAppButton({
  phoneNumber,
  propertyName,
}: {
  phoneNumber: string;
  propertyName?: string;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <WhatsAppButton
        phoneNumber={phoneNumber}
        propertyName={propertyName}
        size="lg"
        className="rounded-full shadow-lg h-14 w-14 p-0"
        showText={false}
      />
    </div>
  );
}
