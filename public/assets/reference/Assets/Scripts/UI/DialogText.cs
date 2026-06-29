using System.Collections;
using System.Collections.Generic;
using UnityEngine;

[System.Serializable]
public class DialogText
{
  [TextArea(3,10)]
    public string texte;
    public int step;
}
