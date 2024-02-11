import type {
  DefaultSharedModuleContext,
  LangiumServices,
  LangiumSharedServices,
  Module,
  PartialLangiumServices,
} from 'langium';
import { EmptyFileSystem, createDefaultModule, createDefaultSharedModule, inject } from 'langium';
import { CommonLexer } from '../common/lexer.js';
import { CommonValueConverter } from '../common/valueConverter.js';
import { MermaidGeneratedSharedModule, PacketGeneratedModule } from '../generated/module.js';
import { PacketTokenBuilder } from './tokenBuilder.js';

/**
 * Declaration of `Packet` services.
 */
type PacketAddedServices = {
  parser: {
    Lexer: CommonLexer;
    TokenBuilder: PacketTokenBuilder;
    ValueConverter: CommonValueConverter;
  };
};

/**
 * Union of Langium default services and `Packet` services.
 */
export type PacketServices = LangiumServices & PacketAddedServices;

/**
 * Dependency injection module that overrides Langium default services and
 * contributes the declared `Packet` services.
 */
export const PacketModule: Module<PacketServices, PartialLangiumServices & PacketAddedServices> = {
  parser: {
    Lexer: (services: PacketServices) => new CommonLexer(services),
    TokenBuilder: () => new PacketTokenBuilder(),
    ValueConverter: () => new CommonValueConverter(),
  },
};

/**
 * Create the full set of services required by Langium.
 *
 * First inject the shared services by merging two modules:
 *  - Langium default shared services
 *  - Services generated by langium-cli
 *
 * Then inject the language-specific services by merging three modules:
 *  - Langium default language-specific services
 *  - Services generated by langium-cli
 *  - Services specified in this file
 * @param context - Optional module context with the LSP connection
 * @returns An object wrapping the shared services and the language-specific services
 */
export function createPacketServices(context: DefaultSharedModuleContext = EmptyFileSystem): {
  shared: LangiumSharedServices;
  Packet: PacketServices;
} {
  const shared: LangiumSharedServices = inject(
    createDefaultSharedModule(context),
    MermaidGeneratedSharedModule
  );
  const Packet: PacketServices = inject(
    createDefaultModule({ shared }),
    PacketGeneratedModule,
    PacketModule
  );
  shared.ServiceRegistry.register(Packet);
  return { shared, Packet };
}