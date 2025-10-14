// Import logos
import orangeEnergyLogo from '@/assets/logos/ORANGE_ENERGY.jpg';
import arganaEnergyLogo from '@/assets/logos/ARGANA_ENERGY.jpg';
import tradigazLogo from '@/assets/logos/TRADIGAZ.jpg';

// Function to convert image to base64
const imageToBase64 = async (imagePath: string): Promise<string> => {
  try {
    const response = await fetch(imagePath);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
};

// Function to get all logos as base64
export const getLogosBase64 = async () => {
  const [orangeEnergy, arganaEnergy, tradigaz] = await Promise.all([
    imageToBase64(orangeEnergyLogo),
    imageToBase64(arganaEnergyLogo),
    imageToBase64(tradigazLogo)
  ]);

  return {
    'ORANGE ENERGY': orangeEnergy,
    'ARGANA ENERGY': arganaEnergy,
    'TRADIGAZ': tradigaz
  };
};
