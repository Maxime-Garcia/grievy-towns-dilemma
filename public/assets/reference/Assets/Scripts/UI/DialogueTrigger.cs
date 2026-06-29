using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class DialogueTrigger : MonoBehaviour
{
    public string product;
    public GameObject buyButton;
    public bool hasSpoken;

    public Dialogue dialogue;
    private string _tag;

    public void TriggerDialogue(bool startStop)
    {
        if (startStop == true)
        {
            if(product != ""){
                GameObject.Find("Canvas/DialogueBox/Acheter").SetActive(true);
            }
            FindObjectOfType<DialogueManager>().StartDialogue(dialogue, product);
        }
        else
        {
            if(product != ""){
                GameObject.Find("Canvas/DialogueBox/Acheter").SetActive(false);
            }
            FindObjectOfType<DialogueManager>().EndDialogue();
        }

        if (GetComponent<Dialogue>().name == "Houx")
        {
            if (GetComponent<Dialogue>().currentStep == 0)
            {
                GameObject.FindWithTag("Player").GetComponent<PlayerController>().hasNormalSpell = true;
            } else if (GetComponent<Dialogue>().currentStep == 1)
            {
                GameObject.FindWithTag("Player").GetComponent<DashMove>().hasDash = true;
            }
        }
        
       
    }

}