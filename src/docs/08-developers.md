# Developers

The Picorules language and ecosystem is developed and maintained by a dedicated team of clinical informaticians and software engineers who are passionate about making clinical decision support more accessible and maintainable.

## Core Team

### Asanga Abeyaratne

**Lead Developer & Architect**

Asanga is the creator and lead architect of the Picorules language. He brings extensive experience in clinical informatics and has been instrumental in designing the language's syntax and semantics to bridge the gap between clinical knowledge and technical implementation.

**GitHub:** [@asaabey](https://github.com/asaabey)
**Email:** [asaabey@gmail.com](mailto:asaabey@gmail.com)

### Ben Creswick

**Core Contributor**

Ben contributes to the development and refinement of the Picorules compiler and tooling. His expertise helps ensure the language compiles efficiently to SQL and integrates seamlessly with clinical systems.

**GitHub:** [@benc64](https://github.com/benc64)

### Patrick Coffey

**Core Contributor**

Patrick works on the Picorules ecosystem, contributing to both the language implementation and supporting tools. His background in software engineering helps maintain code quality and developer experience.

**GitHub:** [@schlerp](https://github.com/schlerp)

## Project History

Picorules was born out of the need for a better way to author clinical decision support rules. Traditional approaches using raw SQL or complex business rule engines proved difficult for clinical informaticians to maintain and understand.

The language was designed with several key principles:

1. **Clinical-First Syntax**: Terms and patterns that make sense to clinicians
2. **SQL Compilation**: Leverage existing database infrastructure
3. **Declarative Approach**: Focus on *what* to compute, not *how*
4. **Modularity**: Enable reusable, composable ruleblocks

### Early Development

The initial development of Picorules focused on addressing the challenges faced at Territory Kidney Care (TKC), where complex clinical logic needed to be:

- **Maintainable** by clinical informaticians without deep SQL expertise
- **Auditable** with clear logic that clinicians could review
- **Performant** to handle large patient populations
- **Flexible** to adapt as clinical guidelines evolved

The language evolved through real-world use, with early ruleblocks serving as test cases for the compiler and syntax design. The team worked closely with clinicians to ensure the abstractions made sense in a clinical context.

### Design Philosophy

From the beginning, Picorules was designed to be:

- **Domain-Specific**: Optimized for clinical decision support, not general-purpose programming
- **Transparent**: Compiled SQL is reviewable and understandable by database administrators
- **Safe**: Type checking and validation prevent common errors before execution
- **Composable**: Ruleblocks can reference and build upon each other's results

## Contributing

We welcome contributions from the community! Whether you're a clinician with domain expertise, a developer who wants to improve the tooling, or someone who has ideas for better documentation, we'd love to hear from you.

### Ways to Contribute

**Share Your Experience**
- Document use cases from your clinical environment
- Share ruleblocks and templates you've developed
- Provide feedback on what works well and what could be improved

**Improve Documentation**
- Fix typos or unclear explanations
- Add examples from different clinical domains
- Translate documentation to other languages

**Report Issues**
- Bug reports with reproducible examples
- Feature requests based on real clinical needs
- Documentation gaps or confusing sections

### Getting Involved

1. **Explore the Documentation**
   - Work through the [Tutorial](02-tutorial.md)
   - Study the [Language Reference](03-language-reference.md)
   - Review the [Examples & Cookbook](07-examples.md)

2. **Join the Community**
   - Open GitHub issues for bugs or feature requests
   - Share your use cases and feedback
   - Connect with other Picorules users

## Contact

For questions, feedback, or collaboration opportunities:

- **GitHub Repository:** [tkc-picorules-rules](https://github.com/asaabey/tkc-picorules-rules)
- **Email:** [asaabey@gmail.com](mailto:asaabey@gmail.com) (Asanga Abeyaratne)
- **Report Issues:** [GitHub Issues](https://github.com/asaabey/tkc-picorules-rules/issues)

## Research and Publications

The Picorules language and its applications in clinical decision support are subjects of ongoing research. If you use Picorules in academic work, please cite:

```
Abeyaratne, A., Creswick, B., & Coffey, P. (2025).
Picorules: A Domain-Specific Language for Clinical Decision Support.
Territory Kidney Care. https://github.com/asaabey/tkc-picorules-rules
```

## Acknowledgments

Picorules has been developed with support from:

- **Territory Kidney Care (TKC)**: Primary implementation site and testing ground
- **Clinical informaticians**: Who provided domain expertise and use cases
- **Early adopters**: Who tested the language and provided valuable feedback
- **Open source community**: For tools and libraries that made this possible

## Thank You

Thank you to everyone who has contributed to Picorules through code, documentation, testing, feedback, or by using it in their clinical systems. Your contributions help make clinical decision support more accessible and effective.

---

*This documentation is maintained by the Picorules development team. Last updated: December 31, 2025.*
