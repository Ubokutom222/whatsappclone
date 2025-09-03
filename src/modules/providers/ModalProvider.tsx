"use client";
import { Dialog } from "@/components/ui/dialog";
import { useContext, createContext, useState, ReactNode } from "react";
import { AddChatModal } from "../home/components/AddChatModal";

type ModalType = "addChat" | "createGroup" | null;

interface ModalContextProps {
  modalType: ModalType;
  openModal: (type: ModalType) => void;
  closeModal: () => void;
}

const ModalContext = createContext<ModalContextProps | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalType, setModalType] = useState<ModalType>(null);

  const openModal = (type: ModalType) => setModalType(type);
  const closeModal = () => setModalType(null);

  return (
    <ModalContext.Provider value={{ modalType, openModal, closeModal }}>
      {children}
      <Dialog open={!!modalType} onOpenChange={closeModal}>
        {modalType === "addChat" && <AddChatModal />}
        {modalType === "createGroup" && <div>Create Group Modal Content</div>}
      </Dialog>
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
};
