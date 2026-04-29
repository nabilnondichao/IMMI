/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 60,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1A1A2E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: '4px solid #B8860B',
    paddingBottom: 20,
  },
  titleBlock: {
    backgroundColor: '#1A1A2E',
    padding: 15,
    borderRadius: 8,
    marginBottom: 30,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#B8860B',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    color: '#64748B',
    fontWeight: 'bold',
  },
  value: {
    fontWeight: 'bold',
  },
  amountSection: {
    marginTop: 20,
    padding: 20,
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    color: '#FFFFFF',
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#B8860B',
  },
  amountInWords: {
    fontSize: 9,
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
    color: '#94A3B8',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 60,
    right: 60,
    textAlign: 'center',
    borderTop: '1px solid #E2E8F0',
    paddingTop: 10,
    fontSize: 8,
    color: '#64748B',
  }
});

interface RecuPaiementProps {
  data: {
    reference: string;
    proprioNom: string;
    proprioContact: string;
    locataireNom: string;
    unite: string;
    maison: string;
    montant: number;
    periode: string;
    date: string;
    mode: string;
    transactionId?: string;
  };
}

export const RecuPaiement = ({ data }: RecuPaiementProps) => {
  // Simple "amount in words" logic for demo - in prod, use a lib like 'number-to-words'
  const amountWords = `${data.montant.toLocaleString()} Francs CFA`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>IMMOAFRIK</Text>
            <Text style={{ color: '#B8860B', fontWeight: 'bold' }}>Gestion d'Excellence</Text>
          </View>
          <View style={{ textAlign: 'right' }}>
            <Text style={{ fontWeight: 'bold' }}>REÇU N° {data.reference}</Text>
            <Text>Émis le {data.date}</Text>
          </View>
        </View>

        <View style={styles.titleBlock}>
          <Text style={styles.title}>Quittance de Loyer</Text>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Propriétaire :</Text>
            <Text style={styles.value}>{data.proprioNom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Contact :</Text>
            <Text style={styles.value}>{data.proprioContact}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Locataire :</Text>
            <Text style={styles.value}>{data.locataireNom}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Localisation :</Text>
            <Text style={styles.value}>{data.maison} — {data.unite}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Période de paiement :</Text>
            <Text style={styles.value}>{data.periode}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Mode de règlement :</Text>
            <Text style={styles.value}>{data.mode}</Text>
          </View>
          {data.transactionId && (
            <View style={styles.row}>
              <Text style={styles.label}>N° Transaction :</Text>
              <Text style={styles.value}>{data.transactionId}</Text>
            </View>
          )}
        </View>

        <View style={styles.amountSection}>
          <Text style={{ fontSize: 10, textAlign: 'center', marginBottom: 10 }}>MONTANT TOTAL PERÇU</Text>
          <Text style={styles.amountText}>{data.montant.toLocaleString()} FCFA</Text>
          <Text style={styles.amountInWords}>Arrêté à la somme de : {amountWords}</Text>
        </View>

        <View style={{ marginTop: 50, flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ width: 150, textAlign: 'center' }}>
            <Text style={{ fontSize: 8, marginBottom: 5 }}>Le Propriétaire / Gérant</Text>
            <View style={{ height: 60, border: '1px solid #E2E8F0' }} />
          </View>
          <View style={{ width: 100, alignItems: 'center' }}>
            <View style={{ 
              backgroundColor: '#B8860B', 
              padding: 10, 
              borderRadius: 50, 
              color: '#FFFFFF',
              fontSize: 8,
              fontWeight: 'bold'
            }}>
              <Text>CACHET</Text>
              <Text>IMMOAFRIK</Text>
            </View>
          </View>
        </View>

        <Text style={styles.footer}>
          Document infalsifiable généré par ImmoAfrik — Référence unique : {data.reference}{'\n'}
          Une copie numérique est conservée sur nos serveurs à titre de preuve légale.
        </Text>
      </Page>
    </Document>
  );
};
