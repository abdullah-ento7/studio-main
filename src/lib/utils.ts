import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Shipment } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the Net Freight Amount based on the detailed fields of a shipment.
 * This logic is derived from the provided invoice image.
 * @param shipment The shipment object containing all necessary details.
 * @returns The calculated net freight amount.
 */
export const getShipmentFare = (shipment: Shipment): number => {
    const grossFreight = shipment.fare || 0;
    const rateDiff = shipment.rateDiff || 0;
    const shortageAmount = shipment.shortageAmount || 0;
    const advancePenalty = shipment.advancePenalty || 0;
    const penaltyTrackerCharges = shipment.penaltyTrackerCharges || 0;
    const otherCharges = shipment.otherCharges || 0;
    const commission = shipment.commission || 0;
    const wht = shipment.wht || 0;

    // Based on the invoice, it seems most are deductions from the gross freight.
    // Net = Gross - (all deductions) + (all additions)
    // It appears Rate Diff and Shortage are deductions.
    // The others (Comm, WHT) are also deductions.
    const netFreightAmount = grossFreight
        - rateDiff
        - shortageAmount
        - advancePenalty
        - penaltyTrackerCharges
        - commission
        - wht
        + otherCharges; // Assuming "Other Charges" might be an addition or deduction, treating as addition for now.

    return netFreightAmount;
}
