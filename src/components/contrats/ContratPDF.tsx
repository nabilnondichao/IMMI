/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';

// Register a font if needed, but standard ones are often enough for simple contracts
// Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff' });

const styles = StyleSheet.create({
  page: {
    padding: 50,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1A1A2E',
    lineHeight: 1.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: '2px solid #B8860B',
    paddingBottom: 20,
  },
  logo: {
    width: 120,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#B8860B',
    textAlign: 'center',
    marginBottom: 30,
    textTransform: 'uppercase',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    textDecoration: 'underline',
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 150,
    fontWeight: 'bold',
  },
  value: {
    flex: 1,
  },
  bodyText: {
    textAlign: 'justify',
    marginBottom: 10,
  },
  signatureContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
  },
  signatureBox: {
    width: 200,
    height: 100,
    border: '1px solid #E2E8F0',
    padding: 10,
    textAlign: 'center',
  },
  signatureLabel: {
    fontSize: 8,
    color: '#94A3B8',
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#94A3B8',
    borderTop: '1px solid #E2E8F0',
    paddingTop: 10,
  }
});

interface ContratPDFProps {
  data: {
    contratId: string;
    proprioNom: string;
    proprioAddress: string;
    locataireNom: string;
    locatairePrenom: string;
    locatairePiece: string;
    maisonNom: string;
    uniteNom: string;
    loyer: number;
    caution: number;
    dateEffet: string;
    dateFin: string;
    preavis: number;
    conditions?: string;
  };
}

export const ContratPDF = ({ data }: ContratPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={{ fontWeight: 'bold', fontSize: 14 }}>ImmoAfrik Management</Text>
          <Text>{data.proprioNom}</Text>
          <Text>{data.proprioAddress}</Text>
        </View>
        <View style={{ textAlign: 'right' }}>
          <Text>Réf: {data.contratId}</Text>
          <Text>Fait le {new Date().toLocaleDateString('fr-FR')}</Text>
        </View>
      </View>

      <Text style={styles.title}>CONTRAT DE BAIL À USAGE D'HABITATION</Text>

      {/* Parties */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>1. LES PARTIES</Text>
        <Text style={styles.bodyText}>
          Entre les soussignés :
        </Text>
        <Text style={styles.bodyText}>
          <Text style={{ fontWeight: 'bold' }}>LE BAILLEUR : </Text>
          {data.proprioNom}, demeurant à {data.proprioAddress}.
        </Text>
        <Text style={styles.bodyText}>
          <Text style={{ fontWeight: 'bold' }}>LE PRENEUR : </Text>
          {data.locatairePrenom} {data.locataireNom}, titulaire de la pièce d'identité N° {data.locatairePiece}.
        </Text>
      </View>

      {/* Objet */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>2. OBJET DU CONTRAT</Text>
        <Text style={styles.bodyText}>
          Le bailleur donne en location au preneur, qui accepte, les locaux désignés ci-après :
        </Text>
        <View style={styles.row}>
          <Text style={styles.label}>Maison :</Text>
          <Text style={styles.value}>{data.maisonNom}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Unité / Local :</Text>
          <Text style={styles.value}>{data.uniteNom}</Text>
        </View>
      </View>

      {/* Conditions Financières */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>3. CONDITIONS FINANCIÈRES</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Loyer mensuel :</Text>
          <Text style={styles.value}>{data.loyer.toLocaleString()} FCFA</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Dépôt de garantie :</Text>
          <Text style={styles.value}>{data.caution.toLocaleString()} FCFA</Text>
        </View>
      </View>

      {/* Durée */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>4. DURÉE ET RÉSILIATION</Text>
        <Text style={styles.bodyText}>
          Le présent contrat est conclu pour une durée allant du {data.dateEffet} au {data.dateFin}.
        </Text>
        <Text style={styles.bodyText}>
          Le délai de préavis est fixé à {data.preavis} jours calendaires pour les deux parties.
        </Text>
      </View>

      {/* Conditions Particulières */}
      {data.conditions && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. CONDITIONS PARTICULIÈRES</Text>
          <Text style={styles.bodyText}>{data.conditions}</Text>
        </View>
      )}

      {/* Signatures */}
      <View style={styles.signatureContainer}>
        <View style={styles.signatureBox}>
          <Text style={{ fontWeight: 'bold', fontSize: 9 }}>LE BAILLEUR</Text>
          <Text style={styles.signatureLabel}>(Précédé de la mention "Lu et approuvé")</Text>
        </View>
        <View style={styles.signatureBox}>
          <Text style={{ fontWeight: 'bold', fontSize: 9 }}>LE PRENEUR</Text>
          <Text style={styles.signatureLabel}>(Précédé de la mention "Lu et approuvé")</Text>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Généré via ImmoAfrik • Plateforme de gestion immobilière • {new Date().getFullYear()}</Text>
      </View>
    </Page>
  </Document>
);
