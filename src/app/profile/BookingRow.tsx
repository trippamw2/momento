import StatusBadge from "./StatusBadge";

interface Booking {
  id: string;
  customer: string;
  experience: string;
  date: string;
  guests: number;
  total: number;
  status: string;
}

export default function BookingRow({ booking }: { booking: Booking }) {
  return (
    <tr className="border-b border-[#ebebeb] hover:bg-[#fafafa] transition-colors">
      <td className="py-3 px-2 text-body-sm text-[#222222]">{booking.id}</td>
      <td className="py-3 px-2 text-body-sm text-[#222222]">{booking.customer}</td>
      <td className="py-3 px-2 text-body-sm text-[#6a6a6a]">{booking.experience}</td>
      <td className="py-3 px-2 text-body-sm text-[#6a6a6a]">{booking.date}</td>
      <td className="py-3 px-2 text-body-sm text-[#6a6a6a]">{booking.guests}</td>
      <td className="py-3 px-2 text-body-sm text-[#222222] font-medium">MK {booking.total.toLocaleString()}</td>
      <td className="py-3 px-2"><StatusBadge status={booking.status} /></td>
    </tr>
  );
}
