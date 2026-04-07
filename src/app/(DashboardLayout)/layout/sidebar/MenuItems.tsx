import {
  IconLayoutDashboard,
  IconTruck,
  IconArrowsTransferUpDown,
  IconPackage,
  IconCategory,
} from "@tabler/icons-react";

import { uniqueId } from "lodash";

const Menuitems = [
  {
    navlabel: true,
    subheader: "HOME",
  },

  {
    id: uniqueId(),
    title: "Dashboard",
    icon: IconLayoutDashboard,
    href: "/",
  },
  {
    navlabel: true,
    subheader: "MANAGEMENT BARANG",
  },
  {
    id: uniqueId(),
    title: "Barang",
    icon: IconPackage,
    href: "/utilities/barang",
  },
  {
    id: uniqueId(),
    title: "Transaksi",
    icon: IconArrowsTransferUpDown,
    href: "/utilities/transaksi",
  },
  {
    id: uniqueId(),
    title: "Kategori",
    icon: IconCategory,
    href: "/utilities/kategori",
  },
  {
    navlabel: true,
    subheader: "MANAGEMENT VENDOR",
  },
  {
    id: uniqueId(),
    title: "Supplier",
    icon: IconTruck,
    href: "/utilities/supplier",
  },
  

];

export default Menuitems;


